import chalk from 'chalk';

import * as Log from '../../log';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';
import { buildAsync } from './xcodebuild';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  assertPlatform();

  const props = await resolveOptionsAsync(projectRoot, options);

  await buildAsync(props);
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
