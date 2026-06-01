import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();

    // 1. Open conversations count (status = OPEN)
    const openConversations = await this.prisma.conversation.count({
      where: { status: 'OPEN' },
    });

    // 2. New leads count (status = NEW)
    const newLeads = await this.prisma.lead.count({
      where: { status: 'NEW' },
    });

    // 3. Open deals count and total value (stage not WON or LOST)
    const openDealsCount = await this.prisma.deal.count({
      where: {
        stage: { notIn: ['WON', 'LOST'] },
      },
    });

    const openDealsSumResult = await this.prisma.deal.aggregate({
      where: {
        stage: { notIn: ['WON', 'LOST'] },
      },
      _sum: {
        value: true,
      },
    });
    const openDealsValue = openDealsSumResult._sum.value || 0;

    // 4. Overdue tasks (status not DONE and dueDate in past)
    const overdueTasks = await this.prisma.task.count({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
    });

    // 5. Recent conversation threads
    const recentConversations = await this.prisma.conversation.findMany({
      take: 5,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // 6. Pipeline distribution
    const deals = await this.prisma.deal.findMany({
      select: {
        stage: true,
        value: true,
      },
    });

    const stagesList = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const;
    const pipelineDistribution = stagesList.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    // 7. Agent Performance
    const agents = await this.prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });

    const agentPerformance = agents.map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      assignedCount: agent._count.conversations,
    }));

    return {
      openConversations,
      newLeads,
      openDeals: openDealsCount,
      pipelineValue: openDealsValue,
      overdueTasks,
      recentConversations,
      pipelineDistribution,
      agentPerformance,
    };
  }
}
