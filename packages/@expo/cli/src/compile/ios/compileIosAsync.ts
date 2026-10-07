import chalk from 'chalk';

import * as Log from '../../log';
import { debugEvent, event } from '../events';
import type { ResolvedOptions } from '../resolveOptions';
import { resolveOptionsAsync } from './resolveOptions';
import { buildAsync } from './xcodebuild';

export async function compileIosAsync(projectRoot: string, options: ResolvedOptions) {
  assertPlatform();

  const props = await resolveOptionsAsync(projectRoot, options);
  debugEvent('ios:build_props', {
    scheme: props.scheme,
    configuration: props.configuration,
    osType: props.osType,
    xcodeProject: debugEvent.path(props.xcodeProject.name),
  });

  const doneBuild = event.span();
  try {
    await buildAsync(props);
  } catch (error) {
    event('build:failed', { platform: 'ios', error: event.error(error as Error) });
    throw error;
  }
  doneBuild('build:done', { platform: 'ios', mode: props.mode });
}

function assertPlatform() {
  if (process.platform !== 'darwin') {
    Log.exit(
      chalk`iOS apps can only be built on macOS devices. Use {cyan eas build -p ios} to build in the cloud.`
    );
  }
}
