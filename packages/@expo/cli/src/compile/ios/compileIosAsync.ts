import * as Log from '../../log';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptions } from './resolveOptions';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  resolveOptions(projectRoot, options);

  Log.exit(`expo compile:ios is not available yet.`);
}
