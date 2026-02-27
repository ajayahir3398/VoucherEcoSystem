import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) { }

  @Get('eod')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'EOD Reconciliation Report',
    description:
      'Compares redemption records against ledger entries for a given date. Flags unmatched transactions as exception items.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Date in YYYY-MM-DD format (default: today)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Reconciliation report with matched/unmatched counts and exception items',
  })
  async getEodReport(@Query('date') date: string) {
    return this.reportingService.getEodReport(date);
  }

  @Get('tax-export')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Tax Compliance Export',
    description: 'Exports the EOD reconciliation report as a CSV payload.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Date in YYYY-MM-DD format (default: today)',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file content',
  })
  async exportTaxCompliance(@Query('date') date: string, @Res() res: Response) {
    const csvData = await this.reportingService.exportTaxCompliance(date);
    const filenameDate = date || new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tax-compliance-${filenameDate}.csv`);

    res.send(csvData);
  }

  @Get('anomalies')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Anomaly Detection',
    description:
      'Detects transaction spikes > 3σ from user mean, counts failed nonce attempts, and lists unresolved sync conflicts.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Anomaly report with spikes, failed nonces, and sync conflicts',
  })
  async getAnomalies() {
    return this.reportingService.getAnomalies();
  }

  @Get('dashboard/operational')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Operational Dashboard',
    description:
      "Live transaction feed (last 24h), active seller count (last 1h), pending sync queue depth, and today's redemption count.",
  })
  @ApiResponse({ status: 200, description: 'Operational metrics' })
  async getOperationalDashboard() {
    return this.reportingService.getOperationalDashboard();
  }

  @Get('dashboard/analytical')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Analytical Dashboard',
    description:
      'Beverage trends (30-day), peak-hour heat map (hour × day-of-week), P2P transfer frequency, and carbon footprint by department.',
  })
  @ApiResponse({ status: 200, description: 'Analytical metrics and trends' })
  async getAnalyticalDashboard() {
    return this.reportingService.getAnalyticalDashboard();
  }

  @Get('dashboard/strategic')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Strategic Dashboard',
    description:
      'Total issuance vs redemption burn rate, program adoption rate, active employees, and ROI metrics.',
  })
  @ApiResponse({ status: 200, description: 'Strategic metrics and KPIs' })
  async getStrategicDashboard() {
    return this.reportingService.getStrategicDashboard();
  }

  @Get('burn-rate')
  @Roles('ADMIN', 'FINANCE')
  @ApiOperation({
    summary: 'Burn Rate Analytics',
    description: 'Returns 30-day time-series data comparing issuance vs. redemption values.',
  })
  @ApiResponse({ status: 200, description: 'Time-series burn rate data' })
  async getBurnRateAnalytics() {
    return this.reportingService.getBurnRateAnalytics();
  }
}
