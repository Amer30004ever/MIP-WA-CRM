import { Injectable, Logger } from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processPayload(payload: any): Promise<void> {
    // Log raw webhook to DB for audit/debugging
    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        source: 'whatsapp',
        payload,
        processed: false,
      },
    });

    try {
      // Extract messages from WhatsApp payload
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) {
        this.logger.log('No messages in payload — status update or other event');
        // Still mark as processed even if it's not a message event
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { processed: true },
        });
        return;
      }

      for (const message of value.messages) {
        this.logger.log(`Processing message from ${message.from} — type: ${message.type}`);
        await this.handleIncomingMessage(message, value.contacts?.[0]);
      }

      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { processed: true },
      });
    } catch (error: any) {
      this.logger.error('Error processing webhook payload', error.stack);
      await this.prisma.webhookLog.update({
        where: { id: webhookLog.id },
        data: { error: error.message || 'Unknown error' },
      });
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

    const messageContent = message.text?.body ?? message.type;
    const messageTimestamp = new Date(Number(message.timestamp) * 1000);

    try {
      // Save message
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          waMessageId: message.id,
          direction: 'INBOUND',
          type: this.mapMessageType(message.type),
          content: messageContent,
          mediaUrl: message.image?.id ?? message.audio?.id ?? null,
          timestamp: messageTimestamp,
        },
      });

      this.logger.log(`✅ Message saved to conversation ${conversation.id}`);

      // Update conversation tracking fields
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: messageTimestamp,
          lastMessagePreview: messageContent.substring(0, 50),
        },
      });
      
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`⚠️ Duplicate message received (ID: ${message.id}), skipping...`);
        return;
      }
      throw error;
    }
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
