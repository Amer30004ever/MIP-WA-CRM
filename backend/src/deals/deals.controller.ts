import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DealStage } from '@prisma/client';

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

class UpdateDealDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

@ApiTags('Deals')
@ApiBearerAuth('JWT')
@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales deal' })
  async create(@Body() dto: CreateDealDto, @CurrentUser() user: { id: string }) {
    return this.dealsService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List all sales deals' })
  async findAll() {
    return this.dealsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific sales deal' })
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sales deal (move stage, value etc.)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.dealsService.update(id, { ...dto, userId: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales deal' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.dealsService.remove(id, user.id);
  }
}
