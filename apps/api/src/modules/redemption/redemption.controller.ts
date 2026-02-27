import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { RedemptionService } from './redemption.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRedemptionDto } from '../shared/dto';

@ApiTags('Redemptions')
@ApiBearerAuth('JWT')
@Controller('api/v1/redemptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RedemptionController {
  private readonly logger = new Logger(RedemptionController.name);

  constructor(private readonly redemptionService: RedemptionService) {}

  @Post()
  @Roles('EMPLOYEE')
  @ApiOperation({
    summary: 'Redeem coupons',
    description:
      'Atomic coupon redemption: validates seller nonce (HMAC + expiry), checks balance, deducts with pessimistic locking, records ledger entry, consumes nonce, updates streak, and sends dual push notifications.',
  })
  @ApiResponse({
    status: 201,
    description: 'Redemption completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient balance or rate limit exceeded',
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid/expired nonce or HMAC verification failed',
  })
  async createRedemption(@Body() createRedemptionDto: CreateRedemptionDto) {
    try {
      return await this.redemptionService.createRedemption(createRedemptionDto);
    } catch (error: any) {
      this.logger.error(
        `Failed to create redemption: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }

  @Get('history')
  @Roles('EMPLOYEE', 'ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Get redemption history',
    description: 'Paginated redemption history for an employee.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Employee UUID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({ status: 200, description: 'Paginated redemption history' })
  async getHistory(
    @Query('employeeId') employeeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.redemptionService.getHistory(employeeId, page, limit);
  }
}
