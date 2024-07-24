import RudderAnalytics from '@expo/rudder-sdk-node';

import { getContext } from './getContext';
import type { TelemetryClient, TelemetryRecord, TelemetryRecordWithDate } from './types';
import UserSettings from '../../api/user/UserSettings';
import { type Actor, getActorDisplayName, getUserAsync } from '../../api/user/user';
import { env } from '../env';

const debug = require('debug')('expo:telemetry:rudderClient') as typeof console.log;

export class RudderClient implements TelemetryClient {
  /** The RudderStack SDK instance */
  private rudderstack: RudderAnalytics;
  /** The known identity of the user */
  private identity: { userId: string; anonymousId: string } | undefined;
  /** The promise to initially identify the user */
  private initialIdentify: Promise<any> | undefined;

  constructor(
    sdk?: RudderAnalytics,
    private mode: 'attached' | 'detached' = 'attached'
  ) {
    if (!sdk) {
      sdk = new RudderAnalytics(
        env.EXPO_STAGING || env.EXPO_LOCAL
          ? '24TKICqYKilXM480mA7ktgVDdea'
          : '24TKR7CQAaGgIrLTgu3Fp4OdOkI', // expo unified
        'https://cdp.expo.dev/v1/batch',
        {
          flushInterval: 300,
        }
      );
    }

    this.rudderstack = sdk;
  }

  /**
   * Wait until the initial identification is complete.
   * This may be called multiple times, from `.record()`, but only calls `getUserAsync` once.
   * Note, this method won't retry after the initial identification returns `undefined`.
   */
  private async waitUntilInitialIdentification() {
    if (!this.identity && !this.initialIdentify) {
      // This method has a side-effect that calls `.identify()` internally
      this.initialIdentify = getUserAsync();
    }

    if (!this.identity && this.initialIdentify) {
      await this.initialIdentify;
    }
  }

  get isIdentified() {
    return !!this.identity;
  }

  async identify(actor?: Actor) {
    if (!actor) return;

    debug('Actor received');

    const userId = actor.id;
    const anonymousId = await UserSettings.getAnonymousIdentifierAsync();

    if (this.identity?.userId === userId && this.identity?.anonymousId === anonymousId) {
      return;
    }

    this.identity = { userId, anonymousId };
    this.rudderstack.identify({
      userId,
      anonymousId,
      traits: {
        username: getActorDisplayName(actor),
        user_id: actor.id,
        user_type: actor.__typename,
      },
    });
  }

  async record(record: TelemetryRecord | TelemetryRecordWithDate) {
    if (!this.identity) {
      await this.waitUntilInitialIdentification();
    }

    if (this.identity) {
      debug('Event received: %s', record.event);

      const originalTimestamp =
        'originalTimestamp' in record ? record.originalTimestamp : undefined;

      await this.rudderstack.track({
        event: record.event,
        originalTimestamp,
        properties: record.properties,
        ...this.identity,
        context: {
          ...getContext(),
          client: { mode: this.mode },
        },
      });
    }
  }

  async flush() {
    await this.rudderstack.flush();
  }
}
