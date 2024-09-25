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
  /** The authenticated user ID, this is used to generate an untracable hash */
  userId?: string;
  /** The underlying telemetry strategy to use */
  strategy?: TelemetryClientStrategy;
};

type TelemetryActor = Required<Pick<TelemetryOptions, 'anonymousId' | 'sessionId'>> & {
  /**
   * Hashed version of the user ID, untracable to an actual user.
   * If this value is set to `undefined`, telemetry is considered uninitialized and will wait until its set.
   * If this value is set to `null`, telemetry is considered initialized without an authenticated user.
   * If this value is set to a string, telemetry is considered initialized with an authenticated user.
   */
  userHash?: string | null;
};

export class Telemetry {
  private context = createContext();
  private client: TelemetryClient = new RudderDetachedClient();
  private actor: TelemetryActor;

  /** A list of all events, recorded before the telemetry was fully initialized */
  private earlyRecords: TelemetryRecord[] = [];

  constructor({
    anonymousId = getAnonymousId(),
    sessionId = crypto.randomUUID(),
    userId,
    strategy = 'detached',
  }: TelemetryOptions = {}) {
    this.actor = { anonymousId, sessionId };
    this.setStrategy(env.EXPO_NO_TELEMETRY_DETACH ? 'debug' : strategy);

    if (userId) {
      this.initialize({ userId });
    }
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

  get isInitialized() {
    return this.actor.userHash !== undefined;
  }

  initialize({ userId }: { userId: string | null }) {
    this.actor.userHash = userId ? hashUserId(userId) : null;
    this.flushEarlyRecords();
  }

  private flushEarlyRecords() {
    if (this.earlyRecords.length) {
      this.recordInternal(this.earlyRecords);
      this.earlyRecords = [];
    }
  }

  private recordInternal(records: TelemetryRecord[]) {
    return this.client.record(
      records.map((record) => ({
        ...record,
        type: 'track' as const,
        sentAt: new Date(),
        messageId: createMessageId(record),
        anonymousId: this.actor.anonymousId,
        userHash: this.actor.userHash,
        context: {
          ...this.context,
          sessionId: this.actor.sessionId,
          client: { mode: this.client.strategy },
        },
      }))
    );
  }

  record(record: TelemetryRecord | TelemetryRecord[]) {
    const records = Array.isArray(record) ? record : [record];

    debug('Recording %d event(s)', records.length);

    if (!this.isInitialized) {
      this.earlyRecords.push(...records);
      return;
    }

    return this.recordInternal(records);
  }

  flush() {
    debug('Flushing events...');
    this.flushEarlyRecords();
    return this.client.flush();
  }

  flushOnExit() {
    this.setStrategy('detached');
    this.flushEarlyRecords();
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

/** Hash the user identifier to make it untracable */
function hashUserId(userId: string) {
  return crypto.createHash('sha256').update(userId).digest('hex');
}
