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
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  industry?: string;
}

class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  industry?: string;
}

@ApiTags('Companies')
@ApiBearerAuth('JWT')
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new B2B company record' })
  async create(@Body() dto: CreateCompanyDto, @CurrentUser() user: { id: string }) {
    return this.companiesService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List all B2B companies' })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific company' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a B2B company record' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.companiesService.update(id, { ...dto, userId: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a B2B company record' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.companiesService.remove(id, user.id);
  }
}
