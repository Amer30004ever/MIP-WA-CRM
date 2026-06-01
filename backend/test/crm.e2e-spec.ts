import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MaVoid CRM Features End-to-End Integration Spec', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  let testCompanyId: string;
  let testContactId: string;
  let testLeadId: string;
  let testDealId: string;
  let testTaskId: string;
  let testNoteId: string;

  const testEmail = `crm-test-${Math.random().toString(36).substring(7)}@mavoid.com`;
  const testPassword = 'Password123';
  const testName = 'CRM Agent';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register & Login to get token
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: testName,
        role: 'AGENT',
      });
    
    userId = regRes.body.user.id;
    authToken = regRes.body.token;
  });

  afterAll(async () => {
    // Delete in reverse order of foreign key dependency
    try {
      if (testNoteId) await prisma.note.delete({ where: { id: testNoteId } });
      if (testTaskId) await prisma.task.delete({ where: { id: testTaskId } });
      if (testDealId) await prisma.deal.delete({ where: { id: testDealId } });
      if (testLeadId) await prisma.lead.delete({ where: { id: testLeadId } });
      if (testContactId) await prisma.contact.delete({ where: { id: testContactId } });
      if (testCompanyId) await prisma.company.delete({ where: { id: testCompanyId } });
      await prisma.user.delete({ where: { id: userId } });
    } catch (e) {
      console.warn('E2E clean up warning:', e.message);
    }
    await app.close();
  });

  // 1. COMPANIES API
  describe('Companies API', () => {
    it('POST /api/v1/companies - should create a B2B company', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'MaVoid Saudi Group',
          domain: 'mavoid.com',
          industry: 'Software Engineering',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('MaVoid Saudi Group');
      testCompanyId = res.body.id;
    });

    it('GET /api/v1/companies - should retrieve all companies', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 2. CONTACTS API
  describe('Contacts API', () => {
    it('POST /api/v1/contacts - should create a customer contact', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Ahmad Salem',
          email: 'ahmad@mavoid.com',
          phone: '+966501111111',
          jobTitle: 'Investment Director',
          companyId: testCompanyId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Ahmad Salem');
      expect(res.body.companyId).toBe(testCompanyId);
      testContactId = res.body.id;
    });

    it('GET /api/v1/contacts - should list contacts with company details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((c: any) => c.id === testContactId);
      expect(found).toBeDefined();
      expect(found.company).toBeDefined();
      expect(found.company.name).toBe('MaVoid Saudi Group');
    });
  });

  // 3. LEADS API
  describe('Leads API', () => {
    it('POST /api/v1/leads - should create a CRM lead opportunity', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Saudi Enterprise CRM Deal',
          value: 75000,
          status: 'NEW',
          assignedToId: userId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Saudi Enterprise CRM Deal');
      expect(res.body.value).toBe(75000);
      testLeadId = res.body.id;
    });
  });

  // 4. DEALS API
  describe('Deals API', () => {
    it('POST /api/v1/deals - should log a pipeline deal', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Venture Expansion Deal',
          value: 120000,
          stage: 'QUALIFIED',
          companyId: testCompanyId,
          contactId: testContactId,
          assignedToId: userId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.stage).toBe('QUALIFIED');
      testDealId = res.body.id;
    });

    it('PATCH /api/v1/deals/:id - should update stage progression', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/deals/${testDealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stage: 'PROPOSAL',
        })
        .expect(HttpStatus.OK);

      expect(res.body.stage).toBe('PROPOSAL');
    });
  });

  // 5. TASKS API
  describe('Tasks API', () => {
    it('POST /api/v1/tasks - should schedule a follow-up action', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Send formal proposal quote',
          description: 'Follow up with Riyadh office.',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: 'TODO',
          assignedToId: userId,
          dealId: testDealId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('TODO');
      testTaskId = res.body.id;
    });
  });

  // 6. NOTES API
  describe('Notes API', () => {
    it('POST /api/v1/notes - should attach log timeline notes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Discussed pricing models, Saudi partner likes options.',
          dealId: testDealId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Discussed pricing models, Saudi partner likes options.');
      testNoteId = res.body.id;
    });
  });

  // 7. DASHBOARD STATISTICS
  describe('Dashboard stats aggregator', () => {
    it('GET /api/v1/dashboard/stats - should output correct pipeline valuation', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('pipelineValue');
      // Value: 120000 (from our deal)
      expect(res.body.pipelineValue).toBeGreaterThanOrEqual(120000);
      expect(res.body.openDeals).toBeGreaterThanOrEqual(1);
      expect(res.body.pipelineDistribution.length).toBeGreaterThanOrEqual(6);
    });
  });
});
