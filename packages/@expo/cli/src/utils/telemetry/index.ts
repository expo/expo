import { DetachedClient } from './DetachedClient';
import { RudderClient } from './RudderClient';
import type { TelemetryClient, TelemetryEvent, TelemetryProperties } from './types';
import { env } from '../env';

/** The singleton telemetry client to use */
let telemetry: TelemetryClient | null = null;

export function getTelemetry(): TelemetryClient | null {
  if (env.EXPO_NO_TELEMETRY || env.EXPO_OFFLINE) return null;
  if (telemetry) return telemetry;

  const client = env.EXPO_NO_TELEMETRY_DETACH
    ? new RudderClient() // Block the CLI process when sending telemetry, useful for testing
    : new DetachedClient(); // Do not block the CLI process when sending telemetry

  process.once('SIGINT', () => client.flush());
  process.once('SIGTERM', () => client.flush());
  process.once('beforeExit', () => client.flush());

  return (telemetry = client);
}

export async function logEventAsync(event: TelemetryEvent, properties?: TelemetryProperties) {
  await getTelemetry()?.record({ event, properties });
}
