import RudderAnalytics from '@expo/rudder-sdk-node';

import { getContext } from './getContext';
import type { TelemetryClient, TelemetryEvent, TelemetryProperties } from './types';
import UserSettings from '../../api/user/UserSettings';
import { Actor, getActorDisplayName, getUserAsync } from '../../api/user/user';
import { env } from '../env';

export class RudderClient implements TelemetryClient {
  private rudderstack: RudderAnalytics;
  private identity: { userId: string; anonymousId: string } | undefined;

  constructor(sdk?: RudderAnalytics) {
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

  get isIdentified() {
    return !!this.identity;
  }

  async identify(actor?: Actor) {
    if (!actor) return;

    const userId = actor.id;
    const anonymousId = await UserSettings.getAnonymousIdentifierAsync();

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

  async record(event: TelemetryEvent, properties: TelemetryProperties = {}): Promise<void> {
    if (!this.isIdentified) {
      await this.identify(await getUserAsync());
    }

    if (this.identity) {
      const { app, ...context } = getContext();
      await this.rudderstack.track({
        event,
        properties: { ...properties, ...app },
        ...this.identity,
        context,
      });
    }
  }

  async flush(): Promise<void> {
    await this.rudderstack.flush();
  }
}
