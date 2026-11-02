import chalk from 'chalk';

import * as Log from '../../log';
import { copyBinaryToOutputAsync } from '../copyBinaryToOutputAsync';
import { debugEvent, event } from '../events';
import type { ResolvedOptions } from '../resolveOptions';
import { buildAsync, getApkPath } from './gradle';
import { resolveOptionsAsync } from './resolveOptions';

export async function compileAndroidAsync(projectRoot: string, options: ResolvedOptions) {
  const doneCompile = event.span();

  const props = await resolveOptionsAsync(projectRoot, options);
  debugEvent('android:build_props', {
    variant: props.variant,
  });

  const doneBuild = event.span();
  try {
    await buildAsync(projectRoot, props);
  } catch (error) {
    event('build:failed', { platform: 'android', error: event.error(error as Error) });
    throw error;
  }
  doneBuild('build:done', { platform: 'android', mode: props.mode });

  let binaryPath = getApkPath(projectRoot, props);
  if (props.outputDir) {
    binaryPath = await copyBinaryToOutputAsync(binaryPath, props.outputDir);
  }
  doneCompile('done', {
    platform: 'android',
    mode: props.mode,
    outputType: props.outputType,
    outputPath: event.path(binaryPath),
  });
  Log.log(chalk`\n{green ✓} Build complete`);
  Log.log(chalk`{bold Binary:} ${binaryPath}`);
}
