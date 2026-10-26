import { WebhookTriggerEvents } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jobs } from '../../jobs/client';
import { getWebhookById } from './get-webhook-by-id';
import { generateSampleWebhookPayload } from './trigger/generate-sample-data';
import { triggerTestWebhook } from './trigger-test-webhook';

vi.mock('../../jobs/client', () => ({
  jobs: {
    triggerJob: vi.fn(),
  },
}));

vi.mock('./get-webhook-by-id', () => ({
  getWebhookById: vi.fn(),
}));

vi.mock('./trigger/generate-sample-data', () => ({
  generateSampleWebhookPayload: vi.fn(),
}));

describe('triggerTestWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers internal.execute-webhook targeting only the tested webhook', async () => {
    const mockWebhook = {
      id: 'webhook-123',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_COMPLETED],
      webhookUrl: 'https://example.com/webhook',
    };

    vi.mocked(getWebhookById).mockResolvedValue(mockWebhook as never);
    vi.mocked(generateSampleWebhookPayload).mockReturnValue({
      payload: { test: true },
    } as never);

    const result = await triggerTestWebhook({
      id: 'webhook-123',
      event: WebhookTriggerEvents.DOCUMENT_COMPLETED,
      userId: 1,
      teamId: 2,
    });

    expect(result).toEqual({ success: true, message: 'Test webhook triggered successfully' });
    expect(jobs.triggerJob).toHaveBeenCalledTimes(1);
    expect(jobs.triggerJob).toHaveBeenCalledWith({
      name: 'internal.execute-webhook',
      payload: {
        event: WebhookTriggerEvents.DOCUMENT_COMPLETED,
        webhookId: 'webhook-123',
        data: { test: true },
      },
    });
  });

  it('throws an error if webhook is disabled', async () => {
    const mockWebhook = {
      id: 'webhook-123',
      enabled: false,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_COMPLETED],
      webhookUrl: 'https://example.com/webhook',
    };

    vi.mocked(getWebhookById).mockResolvedValue(mockWebhook as never);

    await expect(
      triggerTestWebhook({
        id: 'webhook-123',
        event: WebhookTriggerEvents.DOCUMENT_COMPLETED,
        userId: 1,
        teamId: 2,
      }),
    ).rejects.toThrow('Webhook is disabled');

    expect(jobs.triggerJob).not.toHaveBeenCalled();
  });

  it('throws an error if webhook does not support the event', async () => {
    const mockWebhook = {
      id: 'webhook-123',
      enabled: true,
      eventTriggers: [WebhookTriggerEvents.DOCUMENT_SENT],
      webhookUrl: 'https://example.com/webhook',
    };

    vi.mocked(getWebhookById).mockResolvedValue(mockWebhook as never);

    await expect(
      triggerTestWebhook({
        id: 'webhook-123',
        event: WebhookTriggerEvents.DOCUMENT_COMPLETED,
        userId: 1,
        teamId: 2,
      }),
    ).rejects.toThrow('Webhook does not support event: DOCUMENT_COMPLETED');

    expect(jobs.triggerJob).not.toHaveBeenCalled();
  });
});
