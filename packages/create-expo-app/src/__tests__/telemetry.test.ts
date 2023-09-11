import crypto from 'crypto';
import fs from 'fs';
import fetch from 'node-fetch';

import { dotExpoHomeDirectory, getStateJsonPath } from '../paths';
import {
  _resetGlobals,
  AnalyticsEventPhases,
  AnalyticsEventTypes,
  flushAsync,
  identify,
  initializeAnalyticsIdentityAsync,
  track,
} from '../telemetry';

jest.mock('node-fetch');
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return { ...actual, randomUUID: jest.fn(actual.randomUUID) };
});

const fetchAsMock = (fetch as any) as jest.Mock;
const randomUUIDAsMock = (crypto as any).randomUUID as jest.Mock;

function clearGlobals() {
  fetchAsMock.mockClear();
  randomUUIDAsMock.mockClear();
  if (!fs.existsSync(dotExpoHomeDirectory())) {
    fs.mkdirSync(dotExpoHomeDirectory(), { recursive: true });
  }

  if (fs.existsSync(getStateJsonPath())) {
    fs.unlinkSync(getStateJsonPath());
  }
  _resetGlobals();
}

describe('telemetry', () => {
  describe('with no pre-existing state', () => {
    beforeEach(() => {
      clearGlobals();
    });

    it('can enqueue events and send them to the proper endpoint with the proper shape', async () => {
      await initializeAnalyticsIdentityAsync();
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.SUCCESS },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(1);
      const [fetchRequestArgs] = fetchAsMock.mock.calls;
      const [url, request] = fetchRequestArgs;
      expect(url).toEqual('https://cdp.expo.dev/v1/batch');
      const { body } = request;
      expect(request).toEqual(
        expect.objectContaining({
          headers: {
            accept: 'application/json, text/plain, */*',
            authorization: expect.stringContaining('Basic '),
            'content-type': 'application/json;charset=utf-8',
            'user-agent': expect.any(String),
          },
          method: 'POST',
        })
      );
      const bodyAsjson = JSON.parse(body);
      const { batch, sentAt }: { batch: any[]; sentAt: string } = bodyAsjson;
      expect(Number.isNaN(Date.parse(sentAt))).toBeFalsy();
      expect(batch.length).toEqual(3);
      expect(batch[0]).toEqual(
        expect.objectContaining({
          type: 'identify',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          traits: expect.any(Object),
          anonymousId: expect.any(String),
        })
      );
      expect(batch[1]).toEqual(
        expect.objectContaining({
          type: 'track',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          event: AnalyticsEventTypes.CREATE_EXPO_APP,
          properties: {
            phase: AnalyticsEventPhases.ATTEMPT,
          },
          anonymousId: expect.any(String),
        })
      );
      expect(batch[2]).toEqual(
        expect.objectContaining({
          type: 'track',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          event: AnalyticsEventTypes.CREATE_EXPO_APP,
          properties: {
            phase: AnalyticsEventPhases.SUCCESS,
          },
          anonymousId: expect.any(String),
        })
      );
    });

    it('does not enqueue events if not initialized', async () => {
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.SUCCESS },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(0);
    });

    it('does not enqueue events when the analytics identity is null', async () => {
      randomUUIDAsMock.mockImplementationOnce(() => null);
      await initializeAnalyticsIdentityAsync();
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.SUCCESS },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(0);
    });
  });

  describe('with pre-existing state', () => {
    const existingAnonymousId = (crypto as any).randomUUID();
    const existingUserId = (crypto as any).randomUUID();

    beforeEach(() => {
      clearGlobals();
      fs.writeFileSync(
        getStateJsonPath(),
        JSON.stringify({ analyticsDeviceId: existingAnonymousId, auth: { userId: existingUserId } })
      );
    });

    it('can enqueue events and send them to the proper endpoint with the proper shape', async () => {
      await initializeAnalyticsIdentityAsync();
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.SUCCESS },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(1);
      const [fetchRequestArgs] = fetchAsMock.mock.calls;
      const [url, request] = fetchRequestArgs;
      expect(url).toEqual('https://cdp.expo.dev/v1/batch');
      const { body } = request;
      expect(request).toEqual(
        expect.objectContaining({
          headers: {
            accept: 'application/json, text/plain, */*',
            authorization: expect.stringContaining('Basic '),
            'content-type': 'application/json;charset=utf-8',
            'user-agent': expect.any(String),
          },
          method: 'POST',
        })
      );
      const bodyAsjson = JSON.parse(body);
      const { batch, sentAt }: { batch: any[]; sentAt: string } = bodyAsjson;
      expect(Number.isNaN(Date.parse(sentAt))).toBeFalsy();
      expect(batch.length).toEqual(3);
      expect(batch[0]).toEqual(
        expect.objectContaining({
          type: 'identify',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          traits: expect.any(Object),
          anonymousId: existingAnonymousId,
          userId: existingUserId,
        })
      );
      expect(batch[1]).toEqual(
        expect.objectContaining({
          type: 'track',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          event: AnalyticsEventTypes.CREATE_EXPO_APP,
          properties: {
            phase: AnalyticsEventPhases.ATTEMPT,
          },
          anonymousId: existingAnonymousId,
          userId: existingUserId,
        })
      );
      expect(batch[2]).toEqual(
        expect.objectContaining({
          type: 'track',
          sentAt: expect.any(String),
          originalTimestamp: expect.any(String),
          messageId: expect.any(String),
          event: AnalyticsEventTypes.CREATE_EXPO_APP,
          properties: {
            phase: AnalyticsEventPhases.SUCCESS,
          },
          anonymousId: existingAnonymousId,
          userId: existingUserId,
        })
      );
    });

    it('does not enqueue events if not initialized', async () => {
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.SUCCESS },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(0);
    });

    it('can enqueue events when randomUUID is missing by loading state from disk', async () => {
      randomUUIDAsMock.mockImplementationOnce(() => null);
      await initializeAnalyticsIdentityAsync();
      identify();
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.ATTEMPT },
      });
      track({
        event: AnalyticsEventTypes.CREATE_EXPO_APP,
        properties: { phase: AnalyticsEventPhases.FAIL },
      });
      await flushAsync();
      expect(fetchAsMock.mock.calls.length).toEqual(1);
      const [fetchRequestArgs] = fetchAsMock.mock.calls;
      const [, request] = fetchRequestArgs;
      const { batch }: { batch: any[] } = JSON.parse(request.body);
      batch.every(
        message => message.anonymousId === existingAnonymousId && message.userId === existingUserId
      );
    });
  });
});
