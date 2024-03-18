import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { TelemetryClient } from './TelemetryClient';
import type { TelemetryRecord } from './types';
import UserSettings from '../../api/user/UserSettings';
import { Actor } from '../../api/user/user';

const debug = require('debug')('expo:telemetry') as typeof console.log;

export type DetachedTelemetry = {
  actor?: Actor;
  records: TelemetryRecord[];
};

export class RudderDetachedClient extends TelemetryClient {
  private actor: Actor | undefined;

  get isIdentified() {
    return !!this.actor;
  }

  async identify(actor?: Actor) {
    if (actor) this.actor = actor;
  }

  async flush() {
    if (!this.records.length) {
      return debug('No records to flush, skipping...');
    }

    const file = path.join(UserSettings.getDirectory(), '.telemetry.json');
    const data: DetachedTelemetry = { actor: this.actor, records: this.records };

    this.records = [];
    await fs.promises.writeFile(file, JSON.stringify(data));

    const child = spawn(process.execPath, [require.resolve('./flushDetached'), file], {
      detached: true,
      windowsHide: true,
      shell: false,
      stdio: 'ignore',
    });

    child.unref();
  }
}
