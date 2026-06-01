import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; domain?: string; industry?: string; userId?: string }) {
    const company = await this.prisma.company.create({
      data: {
        name: data.name,
        domain: data.domain,
        industry: data.industry,
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'CREATE',
          entityType: 'COMPANY',
          entityId: company.id,
          userId: data.userId,
          details: { name: company.name },
        },
      });
    }

    return company;
  }

  async findAll() {
    return this.prisma.company.findMany({
      include: {
        _count: {
          select: { contacts: true, deals: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: true,
        notes: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return company;
  }

  async update(id: string, data: { name?: string; domain?: string; industry?: string; userId?: string }) {
    await this.findOne(id);
    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        domain: data.domain,
        industry: data.industry,
      },
    });

    if (data.userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'COMPANY',
          entityId: updated.id,
          userId: data.userId,
          details: { changes: data },
        },
      });
    }

    return updated;
  }

  async remove(id: string, userId?: string) {
    const company = await this.findOne(id);
    await this.prisma.company.delete({
      where: { id },
    });

    if (userId) {
      await this.prisma.crmLog.create({
        data: {
          action: 'DELETE',
          entityType: 'COMPANY',
          entityId: id,
          userId,
          details: { name: company.name },
        },
      });
    }

    return { success: true };
  }
}
