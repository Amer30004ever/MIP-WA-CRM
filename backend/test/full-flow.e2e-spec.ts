import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MaVoid WhatsApp CRM End-to-End Flow Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let conversationId: string;
  let inboundMessageId = 'test_wa_msg_id_' + Math.random().toString(36).substring(7);
  let outboundMessageWaId: string;

  const testEmail = `test-agent-${Math.random().toString(36).substring(7)}@mavoid.com`;
  const testPassword = 'Password123';
  const testName = 'Test Agent';
  const testPhone = '966501234567';
  const testPhoneFormatted = '+966501234567';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Set correct verify token for testing
    process.env.WHATSAPP_VERIFY_TOKEN = 'mavoid_webhook_verify_token';
  });

  afterAll(async () => {
    // Clean up all data associated with our tests
    try {
      if (conversationId) {
        await prisma.message.deleteMany({ where: { conversationId } });
        await prisma.conversation.delete({ where: { id: conversationId } });
      }
      await prisma.whatsAppContact.deleteMany({ where: { phone: testPhoneFormatted } });
      await prisma.user.deleteMany({ where: { email: testEmail } });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
    await app.close();
  });

  // 1. HEALTH CHECK
  describe('Health Check', () => {
    it('GET /api/v1/health - should return service status and uptime', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // 2. AUTH FLOW
  describe('Authentication Flow', () => {
    it('POST /api/v1/auth/register - should register a new agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
          role: 'AGENT',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('token');
      
      userId = response.body.user.id;
      authToken = response.body.token;
    });

    it('POST /api/v1/auth/register - should reject duplicate email registrations', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
          role: 'AGENT',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('POST /api/v1/auth/login - should authenticate valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testEmail);
    });

    it('GET /api/v1/auth/me - should return logged-in profile using JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('role', 'AGENT');
    });

    it('GET /api/v1/auth/me - should reject requests without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // 3. WEBHOOK VERIFICATION (GET)
  describe('Webhook Verification', () => {
    it('GET /api/v1/webhook - should verify correct token and echo challenge', async () => {
      const challenge = '1234567890';
      const response = await request(app.getHttpServer())
        .get('/api/v1/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'mavoid_webhook_verify_token',
          'hub.challenge': challenge,
        })
        .expect(HttpStatus.OK);

      expect(response.text).toBe(challenge);
    });

    it('GET /api/v1/webhook - should reject incorrect verify token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'incorrect_token',
          'hub.challenge': '12345',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // 4. WEBHOOK INBOUND PAYLOAD PROCESSING (POST)
  describe('Webhook Inbound Message Ingestion', () => {
    it('POST /api/v1/webhook - should ingest incoming WhatsApp message, auto-create contact & conversation', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550555555',
                    phone_number_id: '1234567890',
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'Test Customer',
                      },
                      wa_id: testPhone,
                    },
                  ],
                  messages: [
                    {
                      from: testPhone,
                      id: inboundMessageId,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: {
                        body: 'Hello MaVoid, this is a test inbound message!',
                      },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/webhook')
        .send(payload)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ status: 'received' });

      // Verify DB State
      const contact = await prisma.whatsAppContact.findUnique({
        where: { phone: testPhoneFormatted },
      });
      expect(contact).not.toBeNull();
      expect(contact!.name).toBe('Test Customer');

      const conversation = await prisma.conversation.findFirst({
        where: { contactId: contact!.id },
      });
      expect(conversation).not.toBeNull();
      expect(conversation!.unreadCount).toBe(1);
      expect(conversation!.lastMessagePreview).toContain('Hello MaVoid');

      conversationId = conversation!.id;

      const message = await prisma.message.findUnique({
        where: { waMessageId: inboundMessageId },
      });
      expect(message).not.toBeNull();
      expect(message!.direction).toBe('INBOUND');
      expect(message!.content).toBe('Hello MaVoid, this is a test inbound message!');
    });

    it('POST /api/v1/webhook - should handle duplicate message gracefully (deduplication/idempotency)', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  contacts: [{ profile: { name: 'Test Customer' }, wa_id: testPhone }],
                  messages: [
                    {
                      from: testPhone,
                      id: inboundMessageId, // Same message ID
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: { body: 'Duplicate message!' },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      // Resending duplicate should still return 200 OK
      await request(app.getHttpServer())
        .post('/api/v1/webhook')
        .send(payload)
        .expect(HttpStatus.OK);

      // Database message count should still be 1 (not duplicated)
      const messagesCount = await prisma.message.count({
        where: { conversationId },
      });
      expect(messagesCount).toBe(1);

      // Unread count should remain 1
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      expect(conversation).not.toBeNull();
      expect(conversation!.unreadCount).toBe(1);
    });
  });

  // 5. CONVERSATIONS API
  describe('Conversations API', () => {
    it('GET /api/v1/conversations - should return paginated list of conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const foundConv = response.body.data.find((c: any) => c.id === conversationId);
      expect(foundConv).toBeDefined();
      expect(foundConv.contact.phone).toBe(testPhoneFormatted);
    });

    it('GET /api/v1/conversations/:id - should return single conversation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', conversationId);
      expect(response.body.contact.phone).toBe(testPhoneFormatted);
    });

    it('GET /api/v1/conversations/:id/messages - should return thread message history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].content).toContain('Hello MaVoid');
    });
  });

  // 6. INBOX ACTIONS (REPLY, ASSIGN, STATUS)
  describe('Conversations Actions & Outbound Replies', () => {
    it('POST /api/v1/conversations/:id/messages/text - should send text reply using mock Meta fallback', async () => {
      const replyContent = 'Hi! How can MaVoid help you today?';
      const response = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages/text`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: replyContent })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('waMessageId');
      expect(response.body.direction).toBe('OUTBOUND');
      expect(response.body.content).toBe(replyContent);

      outboundMessageWaId = response.body.waMessageId;

      // Verify unreadCount has been reset to 0
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      expect(conversation).not.toBeNull();
      expect(conversation!.unreadCount).toBe(0);
      expect(conversation!.lastMessagePreview).toBe(replyContent.substring(0, 50));
    });

    it('PATCH /api/v1/conversations/:id/assign - should assign thread to agent', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/conversations/${conversationId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('assignedToId', userId);
    });

    it('PATCH /api/v1/conversations/:id/status - should update status of thread', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/conversations/${conversationId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'RESOLVED' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status', 'RESOLVED');
    });
  });

  // 7. WEBHOOK MESSAGE STATUS REPORTS
  describe('Webhook Status Reports (Read state)', () => {
    it('POST /api/v1/webhook - should process status update (read event) for outbound message', async () => {
      expect(outboundMessageWaId).toBeDefined();

      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  statuses: [
                    {
                      id: outboundMessageWaId,
                      status: 'read',
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: testPhone,
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/v1/webhook')
        .send(statusPayload)
        .expect(HttpStatus.OK);

      // Verify DB State: message is now marked as read
      const message = await prisma.message.findUnique({
        where: { waMessageId: outboundMessageWaId },
      });
      expect(message).not.toBeNull();
      expect(message!.isRead).toBe(true);
    });
  });
});
