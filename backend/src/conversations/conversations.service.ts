import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConversationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all conversations with contact details and agent assignments.
   * Supports basic status filtering and pagination.
   */
  async findAll(query: { limit?: string; page?: string; status?: string }) {
    const limit = Number(query.limit) || 20;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};
    if (query.status) {
      where.status = query.status as ConversationStatus;
    }

    const [total, data] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: true,
          assignedTo: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        take: limit,
        skip,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  /**
   * Retrieve a specific conversation by ID.
   */
  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID "${id}" not found`);
    }

    return conversation;
  }

  /**
   * Retrieve paginated history of messages in a conversation.
   */
  async findMessages(conversationId: string, query: { limit?: string; page?: string }) {
    // Validate conversation exists
    await this.findOne(conversationId);

    const limit = Number(query.limit) || 50;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.message.count({ where: { conversationId } }),
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: {
          timestamp: 'asc', // Ascending so chat scrolls forward
        },
        take: limit,
        skip,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  /**
   * Dispatch an outbound reply to a customer via WhatsApp Meta Cloud API or mock simulator fallback.
   */
  async sendTextReply(conversationId: string, content: string, senderId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID "${conversationId}" not found`);
    }

    const cleanPhone = conversation.contact.phone.replace('+', '');
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Generate a fallback WhatsApp Message ID in case Meta configuration is missing
    let waMessageId = `wamid.HBgL${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

    if (token && phoneId) {
      try {
        const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
        this.logger.log(`Dispatching Meta API reply to: +${cleanPhone}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { body: content },
          }),
        });

        const data: any = await response.json();

        if (!response.ok) {
          throw new Error(data?.error?.message || 'Meta API returned an error status');
        }

        if (data?.messages?.[0]?.id) {
          waMessageId = data.messages[0].id;
          this.logger.log(`✅ Outbound WhatsApp reply dispatched successfully: ${waMessageId}`);
        }
      } catch (error: any) {
        this.logger.error(`❌ Meta Cloud API request failed: ${error.message}`);
        throw new InternalServerErrorException(
          `Meta WhatsApp API error: ${error.message}`,
        );
      }
    } else {
      this.logger.warn(
        `⚠️ WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured in process.env. Utilizing developer mock simulator.`,
      );
    }

    // Save outbound message to DB
    const newMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        waMessageId,
        direction: 'OUTBOUND',
        type: 'TEXT',
        content,
        isRead: true, // Outbounds we compose are always marked read by us
      },
    });

    // Update conversation metrics
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        unreadCount: 0, // Reset unread count since agent responded
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 50),
      },
    });

    return newMessage;
  }

  /**
   * Update conversation status (OPEN, PENDING, RESOLVED, CLOSED)
   */
  async updateStatus(id: string, status: ConversationStatus) {
    await this.findOne(id);
    return this.prisma.conversation.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Assign or reassign conversation to an agent
   */
  async assign(id: string, userId: string) {
    await this.findOne(id);

    // Verify target agent exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User/Agent with ID "${userId}" not found`);
    }

    return this.prisma.conversation.update({
      where: { id },
      data: { assignedToId: userId },
    });
  }
}
