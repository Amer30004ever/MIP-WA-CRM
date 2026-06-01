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
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  whatsAppContactId?: string;
}

class UpdateContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  whatsAppContactId?: string;
}

@ApiTags('Contacts')
@ApiBearerAuth('JWT')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CRM Contact profile' })
  async create(@Body() dto: CreateContactDto, @CurrentUser() user: { id: string }) {
    return this.contactsService.create({ ...dto, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'List all CRM Contacts' })
  async findAll() {
    return this.contactsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a CRM Contact' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a CRM Contact' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.contactsService.update(id, { ...dto, userId: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CRM Contact' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.contactsService.remove(id, user.id);
  }
}
