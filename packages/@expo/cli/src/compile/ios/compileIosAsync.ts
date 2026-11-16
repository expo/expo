import chalk from 'chalk';

import * as Log from '../../log';
import { copyBinaryToOutputAsync } from '../copyBinaryToOutputAsync';
import { debugEvent, event } from '../events';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';
import { buildAsync, getAppPathAsync } from './xcodebuild';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  const doneCompile = event.span();

  const props = await resolveOptionsAsync(projectRoot, options);
  debugEvent('ios:build_props', {
    scheme: props.scheme,
    configuration: props.configuration,
    osType: props.osType,
    xcodeProject: debugEvent.path(props.xcodeProject.name),
  });

  const doneBuild = event.span();
  try {
    await buildAsync(projectRoot, props);
  } catch (error) {
    event('build:failed', { platform: 'ios', error: event.error(error as Error) });
    throw error;
  }
  doneBuild('build:done', { platform: 'ios', mode: props.mode });

  let binaryPath = await getAppPathAsync(props);
  if (props.outputDir) {
    binaryPath = await copyBinaryToOutputAsync(binaryPath, props.outputDir);
  }
  doneCompile('done', {
    platform: 'ios',
    mode: props.mode,
    outputType: props.outputType,
    outputPath: event.path(binaryPath),
  });
  Log.log(chalk`\n{green ✓} Build complete`);
  Log.log(chalk`{bold Binary:} ${binaryPath}`);
}
