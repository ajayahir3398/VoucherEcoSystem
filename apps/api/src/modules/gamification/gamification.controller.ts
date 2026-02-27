import {
  Controller,
  Get,
  Post,
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
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EcoPointsDto } from '../shared/dto';

@ApiTags('Gamification')
@ApiBearerAuth('JWT')
@Controller('api/v1/gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('stats')
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({
    summary: 'Get gamification stats',
    description:
      'Returns engagement points, eco-points, streak info, badges, leaderboard rank, and carbon saved.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Employee UUID',
  })
  @ApiResponse({ status: 200, description: 'Full gamification stats' })
  async getStats(@Query('employeeId') employeeId: string) {
    return this.gamificationService.getStats(employeeId);
  }

  @Post('eco-points')
  @Roles('EMPLOYEE')
  @ApiOperation({
    summary: 'Award eco-points',
    description:
      'Calculates eco-points based on beverage type (CO₂e table) and reusable cup bonus (+15). Awards: Black Coffee: 0, Dairy: -5, Oat/Soy: +10, Green Tea: +12.',
  })
  @ApiResponse({
    status: 201,
    description: 'Eco-points awarded with carbon footprint info',
  })
  async addEcoPoints(@Body() dto: EcoPointsDto) {
    return this.gamificationService.addEcoPoints(dto);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Individual leaderboard',
    description: 'Top employees ranked by engagement points.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results (default: 20)',
  })
  @ApiResponse({ status: 200, description: 'Ranked list of employees' })
  async getLeaderboard(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.gamificationService.getLeaderboard(limit);
  }

  @Get('leaderboard/department')
  @ApiOperation({
    summary: 'Department leaderboard',
    description:
      'Departments ranked by total engagement points, with member count and averages.',
  })
  @ApiResponse({ status: 200, description: 'Department rankings' })
  async getDepartmentLeaderboard() {
    return this.gamificationService.getDepartmentLeaderboard();
  }

  @Get('badges')
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({
    summary: 'Get earned badges',
    description: 'Returns all badges earned by the employee.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Employee UUID',
  })
  @ApiResponse({ status: 200, description: 'List of earned badges' })
  async getBadges(@Query('employeeId') employeeId: string) {
    return this.gamificationService.getBadges(employeeId);
  }

  @Get('streak')
  @Roles('EMPLOYEE')
  @ApiOperation({
    summary: 'Get streak status',
    description:
      'Returns current streak count, risk warning if no redemption today, next milestone (Day 7 = free Coffee, Day 30 = badge), and days remaining.',
  })
  @ApiQuery({
    name: 'employeeId',
    required: true,
    description: 'Employee UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Streak status with milestone info',
  })
  async getStreakStatus(@Query('employeeId') employeeId: string) {
    return this.gamificationService.getStreakStatus(employeeId);
  }

  @Get('carbon-ledger')
  @Roles('EMPLOYEE', 'ADMIN')
  @ApiOperation({
    summary: 'Get carbon ledger',
    description: 'Returns a detailed list of carbon-saving events for an employee.',
  })
  @ApiQuery({ name: 'employeeId', required: true, description: 'Employee UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated carbon ledger entries' })
  async getCarbonLedger(
    @Query('employeeId') employeeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.gamificationService.getCarbonLedger(employeeId, page, limit);
  }
}
