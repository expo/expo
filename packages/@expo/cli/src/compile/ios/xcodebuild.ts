import spawnAsync from '@expo/spawn-async';

import { CommandError } from '../../utils/errors';
import type { BuildProps } from './resolveOptions';

export function getXcodeBuildArgs(
  props: Pick<BuildProps, 'xcodeProject' | 'configuration' | 'scheme'>
): string[] {
  return [
    props.xcodeProject.isWorkspace ? '-workspace' : '-project',
    props.xcodeProject.name,
    '-configuration',
    props.configuration,
    '-scheme',
    props.scheme,
    '-destination',
    'generic/platform=iOS Simulator',
    'COCOAPODS_PARALLEL_CODE_SIGN=true',
    'COMPILER_INDEX_STORE_ENABLE=NO',
  ];
}

export async function buildAsync(
  props: Pick<BuildProps, 'xcodeProject' | 'configuration' | 'scheme'>
): Promise<void> {
  try {
    await spawnAsync('xcodebuild', getXcodeBuildArgs(props), {
      stdio: 'inherit',
      env: { ...process.env, RCT_NO_LAUNCH_PACKAGER: 'true' },
    });
  } catch (error: any) {
    throw new CommandError(
      `Failed to build iOS project. "xcodebuild" exited with error code ${error.status}.`
    );
  }
}
