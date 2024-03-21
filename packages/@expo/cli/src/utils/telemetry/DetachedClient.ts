import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import type { TelemetryClient, TelemetryEvent, TelemetryRecord } from './types';
import UserSettings from '../../api/user/UserSettings';
import { Actor } from '../../api/user/user';

const debug = require('debug')('expo:telemetry:detachedClient') as typeof console.log;

export type DetachedTelemetry = {
  actor?: Actor;
  records: TelemetryRecord[];
};

export class DetachedClient implements TelemetryClient {
  private actor: Actor | undefined;
  private records: TelemetryRecord[] = [];

  get isIdentified() {
    return !!this.actor;
  }

  async identify(actor?: Actor) {
    if (!actor) return;
    debug('Actor received');
    this.actor = actor;
  }

  async record(event: TelemetryEvent | TelemetryRecord, properties?: Record<string, any>) {
    debug('Event received: %s', event);
    if (typeof event === 'string') {
      this.records.push({ event, properties });
    } else {
      this.records.push(event);
    }
  }

  async flush() {
    if (!this.records.length) {
      return debug('No records to flush, skipping...');
    }

    const file = path.join(UserSettings.getDirectory(), '.telemetry.json');
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
