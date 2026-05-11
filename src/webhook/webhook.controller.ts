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
import type { Response } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * GET /webhook
   * WhatsApp Webhook Verification (Challenge-Response)
   */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Webhook verification request — mode: ${mode}`);

    if (
      mode === 'subscribe' &&
      token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      this.logger.log('✅ Webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('❌ Webhook verification failed — invalid token');
    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Forbidden' });
  }

  /**
   * POST /webhook
   * Receive incoming WhatsApp messages & events
   */
  @Post()
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
