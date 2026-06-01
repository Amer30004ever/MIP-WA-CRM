import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DealStage } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    value: number;
    stage?: DealStage;
    companyId?: string;
    contactId?: string;
    assignedToId?: string;
    userId?: string;
  }) {
    const deal = await this.prisma.deal.create({
      data: {
        title: data.title,
        value: data.value,
        stage: data.stage || 'NEW',
        companyId: data.companyId || null,
        contactId: data.contactId || null,
        assignedToId: data.assignedToId || null,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'CREATE',
          entityType: 'DEAL',
          entityId: deal.id,
          userId: data.userId,
          details: { title: deal.title, value: deal.value, stage: deal.stage },
        },
      });
    }

    return deal;
  }

  async findAll() {
    return this.prisma.deal.findMany({
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
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

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    return deal;
  }

  async update(
    id: string,
    data: {
      title?: string;
      value?: number;
      stage?: DealStage;
      companyId?: string;
      contactId?: string;
      assignedToId?: string;
      userId?: string;
    },
  ) {
    const original = await this.findOne(id);
    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        title: data.title,
        value: data.value,
        stage: data.stage,
        companyId: data.companyId !== undefined ? data.companyId : undefined,
        contactId: data.contactId !== undefined ? data.contactId : undefined,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (data.userId) {
      const isStageChange = data.stage && data.stage !== original.stage;
      await this.prisma.crmLog.create({
        data: {
          action: isStageChange ? 'STAGE_CHANGE' : 'UPDATE',
          entityType: 'DEAL',
          entityId: updated.id,
          userId: data.userId,
          details: isStageChange
            ? { from: original.stage, to: updated.stage, title: updated.title }
            : { changes: data },
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const deal = await this.findOne(id);
    await this.prisma.deal.delete({
      where: { id },
    });

    if (userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'DELETE',
          entityType: 'DEAL',
          entityId: id,
          userId,
          details: { title: deal.title },
        },
      });
    }

    return { success: true };
  }
}
