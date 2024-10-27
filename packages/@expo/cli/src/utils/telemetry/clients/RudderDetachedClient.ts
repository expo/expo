import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { createTempFilePath } from '../../createTempPath';
import type { TelemetryClient, TelemetryClientStrategy, TelemetryRecordInternal } from '../types';

const debug = require('debug')('expo:telemetry:client:detached') as typeof console.log;

export class RudderDetachedClient implements TelemetryClient {
  /** This client should be used for short-lived commands */
  readonly strategy: TelemetryClientStrategy = 'detached';
  /** All recorded telemetry events */
  private records: TelemetryRecordInternal[] = [];

  abort() {
    return this.records;
  }

  record(record: TelemetryRecordInternal[]) {
    this.records.push(
      ...record.map((record) => ({
        ...record,
        originalTimestamp: record.sentAt,
      }))
    );
  }

  async flush() {
    if (!this.records.length) {
      return debug('No records to flush, skipping...');
    }

    const file = createTempFilePath('expo-telemetry.json');
    const data = JSON.stringify({ records: this.records });

    this.records = [];

    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, data);

    const child = spawn(process.execPath, [require.resolve('./flushRudderDetached'), file], {
      detached: true,
      windowsHide: true,
      shell: false,
      stdio: 'ignore',
    });

    child.unref();

    debug('Detached flush started');
  }
}
