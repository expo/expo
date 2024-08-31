import crypto from 'node:crypto';

import { FetchClient } from './clients/FetchClient';
import { RudderDetachedClient } from './clients/RudderDetachedClient';
import { TelemetryClient, TelemetryClientStrategy, TelemetryRecord } from './types';
import { createContext } from './utils/context';
import { getAnonymousId } from '../../api/user/UserSettings';
import { env } from '../env';

const debug = require('debug')('expo:telemetry') as typeof console.log;

type TelemetryOptions = {
  /** A locally generated ID, untracable to an actual user */
  anonymousId?: string;
  /** A locally generated ID, per CLI invocation */
  sessionId?: string;
  /** The underlying telemetry strategy to use */
  strategy?: TelemetryClientStrategy;
};

export class Telemetry {
  private actor: Required<Pick<TelemetryOptions, 'anonymousId' | 'sessionId'>>;
  private context = createContext();
  private client: TelemetryClient = new RudderDetachedClient();

  constructor({
    anonymousId = getAnonymousId(),
    sessionId = crypto.randomUUID(),
    strategy = 'detached',
  }: TelemetryOptions = {}) {
    this.actor = { anonymousId, sessionId };
    this.setStrategy(env.EXPO_NO_TELEMETRY_DETACH ? 'debug' : strategy);
  }

  get strategy() {
    return this.client.strategy;
  }

  setStrategy(strategy: TelemetryOptions['strategy']) {
    // Abort when client is already using the correct strategy
    if (this.client.strategy === strategy) return;
    // Abort when debugging the telemetry
    if (env.EXPO_NO_TELEMETRY_DETACH && strategy !== 'debug') return;

    debug('Switching strategy from %s to %s', this.client.strategy, strategy);

    // Load and instantiate the correct client, based on strategy
    const client = createClientFromStrategy(strategy);
    // Replace the client, and re-record any pending records
    this.client.abort().forEach((record) => client.record([record]));
    this.client = client;

    return this;
  }

  record(record: TelemetryRecord | TelemetryRecord[]) {
    const records = (Array.isArray(record) ? record : [record]).map((record) => ({
      type: 'track' as const,
      ...record,
      sentAt: new Date(),
      messageId: createMessageId(record),
      anonymousId: this.actor.anonymousId,
      context: {
        ...this.context,
        sessionId: this.actor.sessionId,
        client: { mode: this.client.strategy },
      },
    }));

    debug('Recording %d event(s)', records.length);

    return this.client.record(records);
  }

  flush() {
    debug('Flushing events...');
    return this.client.flush();
  }

  flushOnExit() {
    this.setStrategy('detached');
    return this.client.flush();
  }
}

function createClientFromStrategy(strategy: TelemetryOptions['strategy']) {
  // When debugging, use the actual Rudderstack client, but lazy load it
  if (env.EXPO_NO_TELEMETRY_DETACH || strategy === 'debug') {
    const { RudderClient } =
      require('./clients/RudderClient') as typeof import('./clients/RudderClient');
    return new RudderClient();
  }

  return strategy === 'instant' ? new FetchClient() : new RudderDetachedClient();
}

/** Generate a unique message ID using a random hash and UUID */
function createMessageId(record: TelemetryRecord) {
  const uuid = crypto.randomUUID();
  const md5 = crypto.createHash('md5').update(JSON.stringify(record)).digest('hex');

  return `node-${md5}-${uuid}`;
}
