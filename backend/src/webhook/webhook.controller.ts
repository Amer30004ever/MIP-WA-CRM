import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { WebhookService } from './webhook.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * GET /api/v1/webhook
   * WhatsApp Webhook Verification (Challenge-Response)
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'WhatsApp webhook verification',
    description:
      'Meta calls this endpoint to verify the webhook URL. It validates the token and echoes back the challenge.',
  })
  @ApiQuery({ name: 'hub.mode', required: true, example: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', required: true, example: 'my_secret_token' })
  @ApiQuery({ name: 'hub.challenge', required: true, example: '1234567890' })
  @ApiOkResponse({ description: 'Webhook verified — challenge echoed back' })
  @ApiForbiddenResponse({ description: 'Invalid verify token' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Webhook verification request — mode: ${mode}`);

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      this.logger.log('✅ Webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('❌ Webhook verification failed — invalid token');
    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Forbidden' });
  }

  /**
   * POST /api/v1/webhook
   * Receive incoming WhatsApp messages & events
   */
  @Public()
  @Post()
  @ApiOperation({
    summary: 'Receive WhatsApp webhook events',
    description:
      'Meta sends incoming messages, status updates, and other events to this endpoint. Always returns 200 to prevent retries.',
  })
  @ApiOkResponse({
    description: 'Payload received and queued for processing',
    schema: { example: { status: 'received' } },
  })
  async receive(@Body() payload: any, @Res() res: Response) {
    this.logger.log('📨 Incoming webhook payload received');

    try {
      await this.webhookService.processPayload(payload);
      return res.status(HttpStatus.OK).json({ status: 'received' });
    } catch (error) {
      this.logger.error('Failed to process webhook payload', error);
      // Always return 200 to WhatsApp to prevent retries
      return res.status(HttpStatus.OK).json({ status: 'received' });
    }
  }
}
