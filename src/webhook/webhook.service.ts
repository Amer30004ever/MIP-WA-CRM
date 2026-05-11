import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processPayload(payload: any): Promise<void> {
    // Log raw webhook to DB for audit/debugging
    await this.prisma.webhookLog.create({
      data: {
        source: 'whatsapp',
        payload,
        processed: false,
      },
    });

    // Extract messages from WhatsApp payload
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      this.logger.log('No messages in payload — status update or other event');
      return;
    }

    for (const message of value.messages) {
      this.logger.log(`Processing message from ${message.from} — type: ${message.type}`);
      await this.handleIncomingMessage(message, value.contacts?.[0]);
    }
  }

  private async handleIncomingMessage(message: any, contactInfo: any): Promise<void> {
    const phone = message.from; // e.g. "966501234567"
    const normalizedPhone = `+${phone}`;

    // Upsert WhatsApp contact
    const contact = await this.prisma.whatsAppContact.upsert({
      where: { phone: normalizedPhone },
      create: {
        phone: normalizedPhone,
        name: contactInfo?.profile?.name ?? null,
      },
      update: {
        name: contactInfo?.profile?.name ?? undefined,
      },
    });

    // Find or create open conversation for this contact
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        status: 'OPEN',
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { contactId: contact.id },
      });
      this.logger.log(`New conversation created: ${conversation.id}`);
    }

    // Save message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        waMessageId: message.id,
        direction: 'INBOUND',
        type: this.mapMessageType(message.type),
        content: message.text?.body ?? message.type,
        mediaUrl: message.image?.id ?? message.audio?.id ?? null,
        timestamp: new Date(Number(message.timestamp) * 1000),
      },
    });

    this.logger.log(`✅ Message saved to conversation ${conversation.id}`);
  }

  private mapMessageType(waType: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      audio: MessageType.AUDIO,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
      template: MessageType.TEMPLATE,
    };
    return typeMap[waType] ?? MessageType.TEXT;
  }
}
