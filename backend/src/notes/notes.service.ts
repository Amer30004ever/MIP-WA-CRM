import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    content: string;
    authorId: string;
    leadId?: string;
    dealId?: string;
    contactId?: string;
    companyId?: string;
  }) {
    const note = await this.prisma.note.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await this.prisma.crmLog.create({
      data: {
        action: 'CREATE',
        entityType: 'NOTE',
        entityId: note.id,
        userId: data.authorId,
        details: { preview: note.content.substring(0, 50) },
      },
    });

    return note;
  }

  async findAll(filter: {
    leadId?: string;
    dealId?: string;
    contactId?: string;
    companyId?: string;
  }) {
    return this.prisma.note.findMany({
      where: {
        leadId: filter.leadId || undefined,
        dealId: filter.dealId || undefined,
        contactId: filter.contactId || undefined,
        companyId: filter.companyId || undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with ID "${id}" not found`);
    }

    await this.prisma.note.delete({ where: { id } });

    await this.prisma.crmLog.create({
      data: {
        action: 'DELETE',
        entityType: 'NOTE',
        entityId: id,
        userId,
        details: { preview: note.content.substring(0, 50) },
      },
    });

    return { success: true };
  }
}
