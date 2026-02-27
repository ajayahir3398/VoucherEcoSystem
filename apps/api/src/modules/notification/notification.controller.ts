import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PushNotificationDto,
  PushSubscribeDto,
  UnsubscribeDto,
} from '../shared/dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT')
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('push')
  @ApiOperation({
    summary: 'Send push notification',
    description:
      "Dispatches a Web Push notification to all of a user's registered subscriptions.",
  })
  @ApiResponse({
    status: 201,
    description: 'Notification dispatched (or logged if no subscriptions)',
  })
  async sendPush(@Body() dto: PushNotificationDto) {
    return this.notificationService.sendPush(dto);
  }

  @Post('subscribe')
  @ApiOperation({
    summary: 'Subscribe to push notifications',
    description:
      'Registers a Web Push subscription (endpoint + keys) for a user. Deduplicates by endpoint.',
  })
  @ApiResponse({ status: 201, description: 'Subscription registered' })
  async subscribe(@Body() dto: PushSubscribeDto) {
    return this.notificationService.subscribe(dto);
  }

  @Delete('unsubscribe')
  @ApiOperation({
    summary: 'Unsubscribe from push',
    description: 'Removes a push subscription by user ID and endpoint.',
  })
  @ApiResponse({ status: 200, description: 'Subscription removed' })
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.notificationService.unsubscribe(dto.userId, dto.endpoint);
  }
}
