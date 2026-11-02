import chalk from 'chalk';

import * as Log from '../../log';
import { copyBinaryToOutputAsync } from '../copyBinaryToOutputAsync';
import { debugEvent, event } from '../events';
import { buildAsync, getApkPath } from './gradle';
import type { BuildProps } from './resolveOptions';

export async function compileAndroidAsync(projectRoot: string, props: BuildProps) {
  const doneCompile = event.span();

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
