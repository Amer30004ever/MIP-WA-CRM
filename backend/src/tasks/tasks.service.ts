import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: TaskStatus;
    assignedToId?: string;
    leadId?: string;
    dealId?: string;
    conversationId?: string;
    userId?: string;
  }) {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'TODO',
        assignedToId: data.assignedToId || null,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        conversationId: data.conversationId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        conversation: {
          select: {
            id: true,
            contact: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'CREATE',
          entityType: 'TASK',
          entityId: task.id,
          userId: data.userId,
          details: { title: task.title, status: task.status },
        },
      });
    }

    return task;
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        conversation: {
          select: {
            id: true,
            contact: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: true,
        deal: true,
        conversation: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: string;
      status?: TaskStatus;
      assignedToId?: string;
      leadId?: string;
      dealId?: string;
      conversationId?: string;
      userId?: string;
    },
  ) {
    const original = await this.findOne(id);
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        status: data.status,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
        leadId: data.leadId !== undefined ? data.leadId : undefined,
        dealId: data.dealId !== undefined ? data.dealId : undefined,
        conversationId: data.conversationId !== undefined ? data.conversationId : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    if (data.userId) {
      const isStatusChange = data.status && data.status !== original.status;
      await this.prisma.crmLog.create({
        data: {
          action: isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
          entityType: 'TASK',
          entityId: updated.id,
          userId: data.userId,
          details: isStatusChange
            ? { from: original.status, to: updated.status, title: updated.title }
            : { changes: data },
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const task = await this.findOne(id);
    await this.prisma.task.delete({
      where: { id },
    });

    if (userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'DELETE',
          entityType: 'TASK',
          entityId: id,
          userId,
          details: { title: task.title },
        },
      });
    }

    return { success: true };
  }
}
