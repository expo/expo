import type { RequestInit } from 'fetch-nodeshim';
import { Buffer } from 'node:buffer';

import { fetch } from '../../fetch';
import { TelemetryClient, TelemetryClientStrategy, TelemetryRecordInternal } from '../types';
import { TELEMETRY_ENDPOINT, TELEMETRY_TARGET } from '../utils/constants';

type Fetch = typeof fetch;

type FetchClientOptions = {
  /** The fetch method for sending events, should handle retries and timeouts */
  fetch?: Fetch;
  /** The endpoint for recorded events */
  url?: string;
  /** The telemetry target for all events */
  target?: string;
};

type FetchClientEntry = Promise<void> & {
  records: TelemetryRecordInternal[];
  controller: AbortController;
};

export class FetchClient implements TelemetryClient {
  /** This client should be used for long-running commands */
  readonly strategy: TelemetryClientStrategy = 'instant';
  /** The fetch instance used to transport telemetry to the backend */
  private fetch: Fetch;
  /** The endpoint to send events to */
  private url: string;
  /** Additional headers to send with every event */
  private headers: RequestInit['headers'];
  /** All records that are queued and being sent */
  private entries: Set<FetchClientEntry> = new Set();

  constructor({
    fetch = createTelemetryFetch(),
    url = TELEMETRY_ENDPOINT,
    target = TELEMETRY_TARGET,
  }: FetchClientOptions = {}) {
    this.fetch = fetch;
    this.url = url;
    this.headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': `expo-cli/${process.env.__EXPO_VERSION}`,
      authorization: 'Basic ' + Buffer.from(`${target}:`).toString('base64'),
    };
  }

  private queue(
    records: TelemetryRecordInternal[],
    controller: AbortController,
    request: ReturnType<typeof fetch>
  ) {
    const entry: FetchClientEntry = mutePromise(request) as any;
    entry.finally(() => this.entries.delete(entry));
    entry.controller = controller;
    entry.records = records;

    this.entries.add(entry);

    return entry;
  }

  record(record: TelemetryRecordInternal[]) {
    const records = Array.isArray(record) ? record : [record];

    if (!records.length) return;

    const controller = new AbortController();
    const body = JSON.stringify({
      sentAt: new Date(),
      batch: records,
    });

    return this.queue(
      records,
      controller,
      this.fetch(this.url, {
        body,
        method: 'POST',
        signal: controller.signal,
        headers: this.headers,
      })
    );
  }

  flush() {
    return mutePromise(Promise.all(this.entries));
  }

  abort() {
    const records: TelemetryRecordInternal[] = [];

    this.entries.forEach((entry) => {
      try {
        entry.controller.abort();
        records.push(...entry.records);
      } catch {
        // Ignore abort errors
      }
    });

    return records;
  }
}

function createTelemetryFetch(): typeof fetch {
  return async function telemetryFetch(info, init) {
    let error: any;
    for (let attemptCount = 0; attemptCount < 3; attemptCount++) {
      try {
        return await fetch(info, init);
      } catch (_error: any) {
        error = _error;
      }
    }
    throw error;
  };
}

/** Mute a promise by removing the original return type and hide errors */
function mutePromise(promise: Promise<any>) {
  return promise.then(
    () => {},
    () => {}
  );
}
