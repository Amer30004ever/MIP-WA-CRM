import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationStatus } from '@prisma/client';

@ApiTags('Conversations')
@ApiBearerAuth('JWT')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * GET /api/v1/conversations
   * Fetch all conversations with related contact profile & assignee details
   */
  @Get()
  @ApiOperation({
    summary: 'List all conversation threads',
    description: 'Returns a list of conversation threads with contact profiles and agent assignments.',
  })
  @ApiOkResponse({ description: 'Conversations list retrieved successfully' })
  async findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.conversationsService.findAll({ limit, page, status });
  }

  /**
   * GET /api/v1/conversations/:id
   * Fetch details of a single conversation
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve conversation details' })
  @ApiOkResponse({ description: 'Conversation thread found' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  /**
   * GET /api/v1/conversations/:id/messages
   * Fetch the message history of a specific conversation chat thread
   */
  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages within a conversation thread' })
  @ApiOkResponse({ description: 'Paginated message history' })
  @ApiNotFoundResponse({ description: 'Conversation thread not found' })
  async findMessages(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.conversationsService.findMessages(id, { limit, page });
  }

  /**
   * POST /api/v1/conversations/:id/messages/text
   * Send a text message reply to a customer
   */
  @Post(':id/messages/text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send text reply to a customer via WhatsApp' })
  @ApiOkResponse({ description: 'Message sent and stored successfully' })
  @ApiNotFoundResponse({ description: 'Conversation thread not found' })
  async sendTextReply(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string },
  ) {
    this.logger.log(`Agent ${user.id} sending WhatsApp reply to conversation ${id}`);
    return this.conversationsService.sendTextReply(id, dto.content, user.id);
  }

  /**
   * PATCH /api/v1/conversations/:id/status
   * Change conversation lifecycle status (OPEN, PENDING, RESOLVED, CLOSED)
   */
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation lifecycle status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'],
          example: 'RESOLVED',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Conversation status updated' })
  @ApiNotFoundResponse({ description: 'Conversation thread not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ConversationStatus,
  ) {
    return this.conversationsService.updateStatus(id, status);
  }

  /**
   * PATCH /api/v1/conversations/:id/assign
   * Assign or reassign conversation thread to an agent
   */
  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign conversation thread to an agent' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: 'd3b07384-d113-4ec5-a581-22920c8b671a',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Conversation assigned to agent successfully' })
  @ApiNotFoundResponse({ description: 'Conversation thread or user not found' })
  async assign(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.conversationsService.assign(id, userId);
  }
}
