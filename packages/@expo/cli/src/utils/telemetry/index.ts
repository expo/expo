import { DetachedClient } from './DetachedClient';
import { RudderClient } from './RudderClient';
import type { TelemetryClient, TelemetryEvent, TelemetryProperties } from './types';
import { env } from '../env';

const debug = require('debug')('expo:telemetry') as typeof console.log;
const telemetry = getClient();

function getClient(): TelemetryClient | null {
  if (env.EXPO_NO_TELEMETRY) return null;

  const client = env.EXPO_NO_TELEMETRY_DETACHED
    ? new RudderClient() // Block the CLI process when sending telemetry, useful for testing
    : new DetachedClient(); // Do not block the CLI process when sending telemetry

  process.once('SIGINT', () => client.flush());
  process.once('SIGTERM', () => client.flush());
  process.once('beforeExit', () => client.flush());

  return client;
}

export async function logEventAsync(event: TelemetryEvent, properties?: TelemetryProperties) {
  await telemetry?.record(event, properties);
  debug('Telemetry event recorded:', event);
}
