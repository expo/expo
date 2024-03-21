import fs from 'fs';
import path from 'path';

import type { DetachedTelemetry } from './DetachedClient';
import { RudderClient } from './RudderClient';
import UserSettings from '../../api/user/UserSettings';
import { getUserAsync } from '../../api/user/user';

const telemetryFile = process.argv[2];
const telemetryLog = path.join(UserSettings.getDirectory(), '.telemetry.log');

flush()
  .then(() => process.exit(0))
  .catch((error) => {
    fs.writeFileSync(telemetryLog, JSON.stringify(error), 'utf8');
    process.exit(1);
  });

async function flush() {
  if (!telemetryFile) return;

  let json: string;
  let data: DetachedTelemetry;

  try {
    json = await fs.promises.readFile(telemetryFile, 'utf8');
    data = JSON.parse(json) as DetachedTelemetry;
  } catch (error: any) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  if (!data.records.length) {
    return;
  }

  const client = new RudderClient();
  await client.identify(data.actor || (await getUserAsync()));

  for (const record of data.records) {
    await client.record(record);
  }

  await client.flush();
  await fs.promises.unlink(telemetryFile);
}
