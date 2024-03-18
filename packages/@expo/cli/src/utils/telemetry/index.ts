import { RudderDetachedClient } from './RudderDetachedClient';
import { RudderStackClient } from './RudderStackClient';
import type { TelemetryClient } from './TelemetryClient';
import type { TelemetryEvent, TelemetryProperties } from './types';
import { env } from '../env';

const debug = require('debug')('expo:telemetry') as typeof console.log;
const telemetry = getClient();

function getClient(): TelemetryClient | null {
  if (env.EXPO_NO_TELEMETRY) return null;

  const client = env.EXPO_NO_TELEMETRY_DETACHED
    ? new RudderStackClient()
    : new RudderDetachedClient();

  process.once('SIGINT', () => client.flush());
  process.once('SIGTERM', () => client.flush());
  process.once('beforeExit', () => client.flush());

  return client;
}

export async function logEventAsync(event: TelemetryEvent, properties?: TelemetryProperties) {
  await telemetry?.record(event, properties);
  debug('Telemetry event recorded:', event);
}
