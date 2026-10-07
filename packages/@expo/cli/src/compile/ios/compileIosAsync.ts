import * as Log from '../../log';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  await resolveOptionsAsync(projectRoot, options);

  Log.exit(`expo compile:ios is not available yet.`);
}
