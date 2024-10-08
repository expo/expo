import RudderAnalytics from '@expo/rudder-sdk-node';

import { TelemetryClient, TelemetryClientStrategy, TelemetryRecordInternal } from '../types';
import { TELEMETRY_ENDPOINT, TELEMETRY_TARGET } from '../utils/constants';

export class RudderClient implements TelemetryClient {
  /** This client should only be used in debug mode, or in the detached script */
  readonly strategy: TelemetryClientStrategy = 'debug';
  /** The RudderStack SDK instance */
  private rudderstack: RudderAnalytics;

  constructor(sdk?: RudderAnalytics) {
    if (!sdk) {
      sdk = new RudderAnalytics(TELEMETRY_TARGET, TELEMETRY_ENDPOINT, {
        flushInterval: 300,
      });
    }

    this.rudderstack = sdk;
  }

  abort(): TelemetryRecordInternal[] {
    throw new Error('Cannot abort Rudderstack client records');
  }

  async record(records: TelemetryRecordInternal[]) {
    await Promise.all(records.map((record) => this.rudderstack.track(record)));
  }

  async flush() {
    await this.rudderstack.flush();
  }
}
