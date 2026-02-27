import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IssueCouponDto, BulkIssueCouponDto } from '../shared/dto';

@ApiTags('Ledger')
@ApiBearerAuth('JWT')
@Controller('api/v1/ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) { }

  @Get()
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Get all global ledger entries',
    description: 'Paginated, filterable access to the entire ecosystem ledger for auditing.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated global ledger entries' })
  async getAllLedgerEntries(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    return this.ledgerService.getAllLedgerEntries(page, limit, startDate, endDate, type);
  }

  @Get(':employeeId')
  @Roles('EMPLOYEE', 'ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Get employee ledger',
    description:
      'Paginated, date-filterable append-only ledger entries for an employee.',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'ISO date (e.g. 2026-01-01)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'ISO date (e.g. 2026-12-31)',
  })
  @ApiResponse({ status: 200, description: 'Paginated ledger entries' })
  async getEmployeeLedger(
    @Param('employeeId') employeeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getEmployeeLedger(
      employeeId,
      page,
      limit,
      startDate,
      endDate,
    );
  }

  @Get(':employeeId/balance')
  @Roles('EMPLOYEE', 'ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Get coupon balance',
    description:
      'Returns all coupon type balances for an employee with type names and eco-point modifiers.',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of coupon balances with type info',
  })
  async getBalance(@Param('employeeId') employeeId: string) {
    return this.ledgerService.getBalance(employeeId);
  }

  @Post('issue')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Issue coupons (Admin)',
    description:
      'Issue coupons to a single employee. Creates balance if first issuance.',
  })
  @ApiResponse({ status: 201, description: 'Coupons issued successfully' })
  async issueCoupons(@Body() dto: IssueCouponDto) {
    return this.ledgerService.issueCoupons(dto);
  }

  @Post('issue/bulk')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Bulk issue coupons (Admin)',
    description:
      'Issue coupons to multiple employees in one request. Processes each entry independently.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk issuance results with success/failure per entry',
  })
  async bulkIssueCoupons(@Body() dto: BulkIssueCouponDto) {
    return this.ledgerService.bulkIssueCoupons(dto.items, dto.issuedBy);
  }

  @Get('coupon-types/list')
  @ApiOperation({
    summary: 'List coupon types',
    description: 'Returns all active coupon types with CO₂e values.',
  })
  @ApiResponse({ status: 200, description: 'List of active coupon types' })
  async getCouponTypes() {
    return this.ledgerService.getCouponTypes();
  }
}
