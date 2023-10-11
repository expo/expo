#!/usr/bin/env node
import fs from 'fs';

import {
  type DetachedEventsQueue,
  logEventAsync,
  getRudderAnalyticsClient,
} from './rudderstackClient';

(async function () {
  const eventsFile = process.argv.pop();

  if (!eventsFile) {
    process.exit(1);
  }

  for (const [eventName, eventProperties] of loadEvents(eventsFile)) {
    await logEventAsync(eventName, eventProperties);
  }

  await getRudderAnalyticsClient().flush();

  fs.unlinkSync(eventsFile);
  process.exit(0);
})();

function loadEvents(filePath: string): DetachedEventsQueue {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}
