import { Injectable, Logger } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
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
      // Extract messages and statuses from WhatsApp payload
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages && !value?.statuses) {
        this.logger.log('No messages or statuses in payload — other event');
        // Still mark as processed even if it's not a message/status event
        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: { processed: true },
        });
        return;
      }

      if (value?.messages) {
        for (const message of value.messages) {
          this.logger.log(`Processing message from ${message.from} — type: ${message.type}`);
          await this.handleIncomingMessage(message, value.contacts?.[0]);
        }
      }

      if (value?.statuses) {
        for (const status of value.statuses) {
          await this.handleStatusUpdate(status);
        }
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

  private async handleStatusUpdate(status: any): Promise<void> {
    const waMessageId = status.id;
    const statusState = status.status; // 'sent' | 'delivered' | 'read' | 'failed'

    this.logger.log(`Processing status update for message ID: ${waMessageId} — status: ${statusState}`);

    // Find the message in our DB by waMessageId
    const message = await this.prisma.message.findUnique({
      where: { waMessageId },
    });

    if (!message) {
      this.logger.warn(`⚠️ Message with waMessageId ${waMessageId} not found in DB`);
      return;
    }

    if (statusState === 'read') {
      // Mark as read in our schema
      await this.prisma.message.update({
        where: { id: message.id },
        data: { isRead: true },
      });
      this.logger.log(`✅ Message ${message.id} marked as read`);
    } else if (statusState === 'failed') {
      const errorMsg = status.errors?.[0]?.message || 'Unknown Meta API error';
      const errorCode = status.errors?.[0]?.code || 'N/A';
      this.logger.error(`❌ Message ${message.id} failed delivery. Error: ${errorMsg} (Code: ${errorCode})`);
    } else {
      this.logger.log(`ℹ️ Message ${message.id} status transitioned to: ${statusState}`);
    }
  }

  private mapMessageType(waType: string): $Enums.MessageType {
    const typeMap: Record<string, $Enums.MessageType> = {
      text: $Enums.MessageType.TEXT,
      image: $Enums.MessageType.IMAGE,
      audio: $Enums.MessageType.AUDIO,
      video: $Enums.MessageType.VIDEO,
      document: $Enums.MessageType.DOCUMENT,
      template: $Enums.MessageType.TEMPLATE,
    };
    return typeMap[waType] ?? $Enums.MessageType.TEXT;
  }
}
