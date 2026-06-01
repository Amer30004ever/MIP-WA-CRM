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
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LeadStatus } from '@prisma/client';

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsString()
  @IsOptional()
  whatsAppContactId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

class UpdateLeadDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsString()
  @IsOptional()
  whatsAppContactId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

@ApiTags('Leads')
@ApiBearerAuth('JWT')
@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales lead' })
  async create(@Body() dto: CreateLeadDto, @CurrentUser() user: { id: string }) {
    return this.leadsService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List all sales leads' })
  async findAll() {
    return this.leadsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific sales lead' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sales lead' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.leadsService.update(id, { ...dto, userId: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sales lead' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.leadsService.remove(id, user.id);
  }
}
