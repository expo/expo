import spawnAsync from '@expo/spawn-async';

import { EXPO_DIR } from '../Constants';

async function getCurrentBranchNameAsync() {
  const { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: EXPO_DIR,
  });
  return stdout.replace(/\n+$/, '');
}

export default async function getSDKVersionFromBranchNameAsync(): Promise<string | undefined> {
  const currentBranch = await getCurrentBranchNameAsync();
  const match = currentBranch.match(/\bsdk-(\d+)$/);

  if (match) {
    const sdkMajorNumber = match[1];
    return `${sdkMajorNumber}.0.0`;
  }
  return;
}
