import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  leadId?: string;

  @IsString()
  @IsOptional()
  dealId?: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  companyId?: string;
}

@ApiTags('Notes')
@ApiBearerAuth('JWT')
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new text note to a CRM object' })
  async create(@Body() dto: CreateNoteDto, @CurrentUser() user: { id: string }) {
    return this.notesService.create({ ...dto, authorId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all notes with optional CRM target filtering' })
  @ApiQuery({ name: 'leadId', required: false, type: String })
  @ApiQuery({ name: 'dealId', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  async findAll(
    @Query('leadId') leadId?: string,
    @Query('dealId') dealId?: string,
    @Query('contactId') contactId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.notesService.findAll({ leadId, dealId, contactId, companyId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notesService.remove(id, user.id);
  }
}
