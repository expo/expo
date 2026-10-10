import spawnAsync from '@expo/spawn-async';
import path from 'path';

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

export async function getAppPathAsync(
  props: Pick<BuildProps, 'xcodeProject' | 'configuration' | 'scheme'>
): Promise<string> {
  const { stdout } = await spawnAsync('xcodebuild', [
    ...getXcodeBuildArgs(props),
    '-showBuildSettings',
    '-json',
  ]);
  let settings;
  try {
    settings = JSON.parse(stdout);
  } catch (error: any) {
    throw new CommandError(
      `Could not parse JSON returned from "xcodebuild -showBuildSettings -json".\n\n${stdout.trim()}\n\nError: ${error.message}`
    );
  }
  const { buildSettings } = settings.find(
    ({ target }: { target: string }) => target === props.scheme
  );
  return path.join(buildSettings.TARGET_BUILD_DIR, buildSettings.WRAPPER_NAME);
}
