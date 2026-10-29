import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { CommandError } from '../../utils/errors';
import type { BuildProps } from './resolveOptions';

export function getGradleArgs(props: Pick<BuildProps, 'variant'>): string[] {
  const task = props.variant.charAt(0).toUpperCase() + props.variant.slice(1);
  return [
    `app:assemble${task}`,
    '-x',
    'lint',
    '-x',
    'test',
    '--configure-on-demand',
    '--build-cache',
  ];
}

export async function buildAsync(
  projectRoot: string,
  props: Pick<BuildProps, 'variant'>
): Promise<void> {
  const androidProjectRoot = path.join(projectRoot, 'android');
  try {
    await spawnAsync(
      path.join(androidProjectRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'),
      getGradleArgs(props),
      { cwd: androidProjectRoot, stdio: 'inherit' }
    );
  } catch (error: any) {
    throw new CommandError(
      `Failed to build Android project. "gradlew" exited with error code ${error.status}.`
    );
  }
}

export function getApkPath(projectRoot: string, props: Pick<BuildProps, 'variant'>): string {
  const apkDirectory = path.join(projectRoot, 'android/app/build/outputs/apk', props.variant);
  const metadataPath = path.join(apkDirectory, 'output-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new CommandError(`Could not find the built APK in ${apkDirectory}.`);
  }
  const contents = fs.readFileSync(metadataPath, 'utf8');
  let metadata: { elements: { type: string; outputFile: string }[] };
  try {
    metadata = JSON.parse(contents);
  } catch (error: any) {
    throw new CommandError(
      `Could not parse JSON in "${metadataPath}".\n\n${contents.trim()}\n\nError: ${error.message}`
    );
  }
  const element = metadata.elements.find(({ type }) => type === 'SINGLE' || type === 'UNIVERSAL');
  if (!element) {
    throw new CommandError(
      `The build made several APKs in ${apkDirectory}, and compile needs one APK that works on every device. If android/app/build.gradle splits APKs by architecture, add \`universalApk true\` to its \`splits.abi\` block.`
    );
  }
  return path.join(apkDirectory, element.outputFile);
}
