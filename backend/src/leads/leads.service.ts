import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    value?: number;
    status?: LeadStatus;
    whatsAppContactId?: string;
    assignedToId?: string;
    userId?: string;
  }) {
    const lead = await this.prisma.lead.create({
      data: {
        title: data.title,
        value: data.value || 0,
        status: data.status || 'NEW',
        whatsAppContactId: data.whatsAppContactId || null,
        assignedToId: data.assignedToId || null,
      },
      include: {
        whatsAppContact: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'CREATE',
          entityType: 'LEAD',
          entityId: lead.id,
          userId: data.userId,
          details: { title: lead.title, value: lead.value, status: lead.status },
        },
      });
    }

    return lead;
  }

  async findAll() {
    return this.prisma.lead.findMany({
      include: {
        whatsAppContact: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        whatsAppContact: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        tasks: true,
        notes: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  async update(
    id: string,
    data: {
      title?: string;
      value?: number;
      status?: LeadStatus;
      whatsAppContactId?: string;
      assignedToId?: string;
      userId?: string;
    },
  ) {
    await this.findOne(id);
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        title: data.title,
        value: data.value,
        status: data.status,
        whatsAppContactId: data.whatsAppContactId !== undefined ? data.whatsAppContactId : undefined,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
      },
      include: {
        whatsAppContact: true,
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'LEAD',
          entityId: updated.id,
          userId: data.userId,
          details: { changes: data },
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const lead = await this.findOne(id);
    await this.prisma.lead.delete({
      where: { id },
    });

    if (userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'DELETE',
          entityType: 'LEAD',
          entityId: id,
          userId,
          details: { title: lead.title },
        },
      });
    }

    return { success: true };
  }
}
