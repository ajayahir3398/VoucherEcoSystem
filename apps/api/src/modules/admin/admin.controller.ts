import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BulkIssueDto, CreateUserDto, UpdateUserDto, UpdateConfigDto, CreateCouponDto, UpdateCouponDto } from './dto';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('coupons/bulk-issue')
    @ApiOperation({
        summary: 'Bulk issue coupons',
        description: 'Issue coupons to multiple employees at once.',
    })
    @ApiResponse({ status: 201, description: 'Coupons issued successfully' })
    async bulkIssueCoupons(@Body() bulkIssueDto: BulkIssueDto, @CurrentUser('id') adminId: string) {
        return this.adminService.bulkIssueCoupons(bulkIssueDto, adminId);
    }

    @Get('dashboard-stats')
    @ApiOperation({
        summary: 'Get dashboard statistics',
        description: 'Retrieve general KPIs for the admin dashboard.',
    })
    @ApiResponse({ status: 200, description: 'Dashboard stats' })
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    @ApiOperation({
        summary: 'List users',
        description: 'Retrieve a list of users (employees, sellers, admins, finance).',
    })
    @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of users' })
    async getUsers(
        @Query('role') role?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.adminService.getUsers(role, page, limit);
    }

    @Post('users')
    @ApiOperation({
        summary: 'Create user',
        description: 'Create a new user (usually a seller or admin).',
    })
    @ApiResponse({ status: 201, description: 'User created' })
    async createUser(@Body() createUserDto: CreateUserDto, @CurrentUser('id') adminId: string) {
        return this.adminService.createUser(createUserDto, adminId);
    }

    @Patch('users/:id')
    @ApiOperation({
        summary: 'Update user',
        description: 'Update user details or status.',
    })
    @ApiResponse({ status: 200, description: 'User updated' })
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.adminService.updateUser(id, updateUserDto, adminId);
    }

    @Get('config')
    @ApiOperation({
        summary: 'Get system config',
        description: 'Retrieve system configuration values.',
    })
    @ApiResponse({ status: 200, description: 'System configurations' })
    async getConfig() {
        return this.adminService.getConfig();
    }

    @Patch('config')
    @ApiOperation({
        summary: 'Update system config',
        description: 'Update a system configuration value.',
    })
    @ApiResponse({ status: 200, description: 'Config updated' })
    async updateConfig(@Body() updateConfigDto: UpdateConfigDto, @CurrentUser('id') adminId: string) {
        return this.adminService.updateConfig(updateConfigDto, adminId);
    }

    @Get('audit-logs')
    @ApiOperation({
        summary: 'Get audit logs',
        description: 'Retrieve audit trail of administrative actions.',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Audit logs' })
    async getAuditLogs(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.adminService.getAuditLogs(+page, +limit);
    }

    // --- Coupon Management ---

    @Get('coupons')
    @ApiOperation({
        summary: 'List all coupons',
        description: 'Retrieve all available coupon types.',
    })
    @ApiResponse({ status: 200, description: 'List of coupons' })
    async getCoupons() {
        return this.adminService.getCoupons();
    }

    @Post('coupons')
    @ApiOperation({
        summary: 'Create coupon',
        description: 'Create a new coupon type.',
    })
    @ApiResponse({ status: 201, description: 'Coupon created' })
    async createCoupon(@Body() createCouponDto: CreateCouponDto, @CurrentUser('id') adminId: string) {
        return this.adminService.createCoupon(createCouponDto, adminId);
    }

    @Patch('coupons/:id')
    @ApiOperation({
        summary: 'Update coupon',
        description: 'Update an existing coupon type.',
    })
    @ApiResponse({ status: 200, description: 'Coupon updated' })
    async updateCoupon(
        @Param('id') id: string,
        @Body() updateCouponDto: UpdateCouponDto,
        @CurrentUser('id') adminId: string,
    ) {
        return this.adminService.updateCoupon(id, updateCouponDto, adminId);
    }

    @Get('coupons/:id')
    @ApiOperation({
        summary: 'Get coupon',
        description: 'Get an existing coupon type.',
    })
    @ApiResponse({ status: 200, description: 'Coupon returned' })
    async getCoupon(
        @Param('id') id: string
    ) {
        return this.adminService.getCoupon(id);
    }

    @Delete('coupons/:id')
    @ApiOperation({
        summary: 'Delete coupon',
        description: 'Delete an existing coupon type.',
    })
    @ApiResponse({ status: 200, description: 'Coupon deleted' })
    async deleteCoupon(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ) {
        return this.adminService.deleteCoupon(id, adminId);
    }

    // --- Sync Conflict Management ---

    @Get('sync-conflicts')
    @ApiOperation({
        summary: 'List sync conflicts',
        description: 'Retrieve a list of synchronization conflicts.',
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of sync conflicts' })
    async getSyncConflicts(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.adminService.getSyncConflicts(+page, +limit);
    }

    @Patch('sync-conflicts/:id/resolve')
    @ApiOperation({
        summary: 'Resolve sync conflict',
        description: 'Mark a synchronization conflict as resolved.',
    })
    @ApiResponse({ status: 200, description: 'Conflict resolved' })
    async resolveSyncConflict(
        @Param('id') id: string,
        @Body() resolution: { note: string },
        @CurrentUser('id') adminId: string,
    ) {
        return this.adminService.resolveSyncConflict(id, resolution, adminId);
    }
}
