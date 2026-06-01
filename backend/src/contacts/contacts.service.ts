import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    companyId?: string;
    whatsAppContactId?: string;
    userId?: string;
  }) {
    const contact = await this.prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        companyId: data.companyId || null,
        whatsAppContactId: data.whatsAppContactId || null,
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'CREATE',
          entityType: 'CONTACT',
          entityId: contact.id,
          userId: data.userId,
          details: { name: contact.name },
        },
      });
    }

    return contact;
  }

  async findAll() {
    return this.prisma.contact.findMany({
      include: {
        company: { select: { id: true, name: true } },
        whatsAppContact: { select: { id: true, phone: true } },
        _count: { select: { deals: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        whatsAppContact: true,
        deals: true,
        notes: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`CRM Contact with ID "${id}" not found`);
    }

    return contact;
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      companyId?: string;
      whatsAppContactId?: string;
      userId?: string;
    },
  ) {
    await this.findOne(id);
    const updated = await this.prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        companyId: data.companyId !== undefined ? data.companyId : undefined,
        whatsAppContactId: data.whatsAppContactId !== undefined ? data.whatsAppContactId : undefined,
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'CONTACT',
          entityId: updated.id,
          userId: data.userId,
          details: { changes: data },
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const contact = await this.findOne(id);
    await this.prisma.contact.delete({
      where: { id },
    });

    if (userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'DELETE',
          entityType: 'CONTACT',
          entityId: id,
          userId,
          details: { name: contact.name },
        },
      });
    }

    return { success: true };
  }
}
