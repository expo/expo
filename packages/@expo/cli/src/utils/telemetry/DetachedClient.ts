import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import type { TelemetryClient, TelemetryRecord, TelemetryRecordWithDate } from './types';
import type { Actor } from '../../api/user/user';
import { createTempFilePath } from '../../utils/createTempPath';

const debug = require('debug')('expo:telemetry:detachedClient') as typeof console.log;

export type DetachedTelemetry = {
  actor?: Actor;
  records: TelemetryRecordWithDate[];
};

export class DetachedClient implements TelemetryClient {
  private actor: Actor | undefined;
  private records: TelemetryRecordWithDate[] = [];

  get isIdentified() {
    return !!this.actor;
  }

  async identify(actor?: Actor) {
    if (!actor) return;
    debug('Actor received');
    this.actor = actor;
  }

  async record(record: TelemetryRecord) {
    debug('Event received: %s', record.event);
    this.records.push({ ...record, originalTimestamp: new Date() });
  }

  async flush() {
    if (!this.records.length) {
      return debug('No records to flush, skipping...');
    }

    const file = createTempFilePath('expo-telemetry.json');
    const data: DetachedTelemetry = { actor: this.actor, records: this.records };

    this.records = [];

    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(data));

    const child = spawn(process.execPath, [require.resolve('./flushDetached'), file], {
      detached: true,
      windowsHide: true,
      shell: false,
      stdio: 'ignore',
    });

    child.unref();

    debug('Detached flush started');
  }
}
