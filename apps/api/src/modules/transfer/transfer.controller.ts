import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTransferDto } from '../shared/dto';

@ApiTags('Transfers')
@ApiBearerAuth('JWT')
@Controller('api/v1/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @Roles('EMPLOYEE')
  @ApiOperation({
    summary: 'Transfer coupons (P2P)',
    description:
      'Atomic P2P coupon transfer: debits sender, credits recipient (creates balance if new), records dual ledger entries, awards +15 Appreciation Star points, sends dual push notifications, and posts to Appreciation Wall.',
  })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance, self-transfer, or recipient not found',
  })
  async createTransfer(@Body() createTransferDto: CreateTransferDto) {
    return this.transferService.createTransfer(createTransferDto);
  }

  @Get('history')
  @Roles('EMPLOYEE', 'ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Get transfer history',
    description: 'Paginated transfer history (sent + received) for a user.',
  })
  @ApiQuery({ name: 'userId', required: true, description: 'User UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated transfer history with counterparty names',
  })
  async getHistory(
    @Query('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.transferService.getHistory(userId, page, limit);
  }

  @Get('appreciation-wall')
  @ApiOperation({
    summary: 'Appreciation Wall',
    description:
      'Public feed of P2P coupon gifts between employees who have public recognition enabled.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Appreciation wall entries' })
  async getAppreciationWall(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.transferService.getAppreciationWall(page, limit);
  }
}
