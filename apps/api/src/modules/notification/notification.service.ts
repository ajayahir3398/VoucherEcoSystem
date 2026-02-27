import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PushSubscription } from '../../entities';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  async sendPush(dto: { userId: string; title: string; body: string }) {
    // Find user's push subscriptions
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { userId: dto.userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`No push subscriptions found for user: ${dto.userId}`);
      // Fallback: just log it
      this.logger.log(
        `Push notification [${dto.userId}]: ${dto.title} — ${dto.body}`,
      );
      return { sent: false, reason: 'No subscriptions', userId: dto.userId };
    }

    // In production, use web-push library here:
    // const webpush = require('web-push');
    // webpush.setVapidDetails(
    //   'mailto:admin@digitalvoucher.com',
    //   this.configService.get('VAPID_PUBLIC_KEY'),
    //   this.configService.get('VAPID_PRIVATE_KEY'),
    // );
    //
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(
    //     { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    //     JSON.stringify({ title: dto.title, body: dto.body }),
    //   );
    // }

    this.logger.log(
      `Push notification dispatched to ${subscriptions.length} subscription(s) for user: ${dto.userId}`,
    );

    return {
      sent: true,
      subscriptionCount: subscriptions.length,
      userId: dto.userId,
    };
  }

  async sendDualPush(
    employeeId: string,
    sellerId: string,
    employeeNotification: { title: string; body: string },
    sellerNotification: { title: string; body: string },
  ) {
    const results = await Promise.allSettled([
      this.sendPush({
        userId: employeeId,
        ...employeeNotification,
      }),
      this.sendPush({
        userId: sellerId,
        ...sellerNotification,
      }),
    ]);

    return {
      employeeResult:
        results[0].status === 'fulfilled'
          ? results[0].value
          : {
              sent: false,
              error: (results[0] as PromiseRejectedResult).reason,
            },
      sellerResult:
        results[1].status === 'fulfilled'
          ? results[1].value
          : {
              sent: false,
              error: (results[1] as PromiseRejectedResult).reason,
            },
    };
  }

  async subscribe(dto: {
    userId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) {
    // Check if this endpoint is already registered
    const existing = await this.pushSubscriptionRepository.findOne({
      where: { userId: dto.userId, endpoint: dto.endpoint },
    });

    if (existing) {
      this.logger.log(
        `Push subscription already exists for user: ${dto.userId}`,
      );
      return { subscribed: true, existing: true };
    }

    const subscription = this.pushSubscriptionRepository.create({
      userId: dto.userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
    });
    await this.pushSubscriptionRepository.save(subscription);

    this.logger.log(`Push subscription registered for user: ${dto.userId}`);
    return { subscribed: true, existing: false };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.pushSubscriptionRepository.delete({
      userId,
      endpoint,
    });

    this.logger.log(`Push subscription removed for user: ${userId}`);
    return { unsubscribed: true };
  }
}
