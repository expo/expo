import fs from 'node:fs';

import type { TelemetryRecordInternal } from '../types';
import { FetchClient } from './FetchClient';

const telemetryFile = process.argv[2];

flush()
  .catch(() => {
    if (telemetryFile) {
      fs.promises.unlink(telemetryFile);
    }
  })
  .finally(() => process.exit(0));

async function flush() {
  if (!telemetryFile) return;

  let json: string;
  let data: { records: TelemetryRecordInternal[] };

  try {
    json = await fs.promises.readFile(telemetryFile, 'utf8');
    data = JSON.parse(json) as any;
  } catch (error: any) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  if (data.records.length) {
    const client = new FetchClient();
    await client.record(data.records);
    await client.flush();
  }

  await fs.promises.unlink(telemetryFile);
}
