import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
    EMPLOYEE = 'EMPLOYEE',
    SELLER = 'SELLER',
    ADMIN = 'ADMIN',
    FINANCE = 'FINANCE',
}

export class BulkIssueItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    couponTypeId: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;
}

export class BulkIssueDto {
    @ApiProperty({ type: [BulkIssueItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkIssueItemDto)
    items: BulkIssueItemDto[];
}

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: UserRole })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    password?: string;
}

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    status?: string;
}

export class UpdateConfigDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty()
    @IsNotEmpty()
    value: any;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateCouponDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNumber()
    co2ePerServing: number;

    @ApiProperty()
    @IsNumber()
    ecoPointsModifier: number;

    @ApiPropertyOptional()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCouponDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    co2ePerServing?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    ecoPointsModifier?: number;

    @ApiPropertyOptional()
    @IsOptional()
    isActive?: boolean;
}

