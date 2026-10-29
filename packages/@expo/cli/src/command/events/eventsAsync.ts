import { tap } from '2g/api';

import { resolveExpoSession } from '../sessions';
import type { Options } from './resolveOptions';

export async function eventsAsync(options: Options) {
  const session = await resolveExpoSession(options.selector);
  for await (const event of tap(session.sessionDir, {
    since: options.since,
    filter: options.filter,
    spans: options.spans,
    follow: options.follow,
  })) {
    process.stdout.write(`${JSON.stringify(event)}\n`);
  }
}
