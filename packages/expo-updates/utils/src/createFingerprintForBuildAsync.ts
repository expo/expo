import { getConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';

import { createFingerprintAsync } from './createFingerprintAsync';
import { resolveWorkflowAsync } from './workflow';

export async function createFingerprintForBuildAsync(
  platform: 'ios' | 'android',
  possibleProjectRoot: string,
  destinationDir: string
): Promise<void> {
  // Remove projectRoot validation when we no longer support React Native <= 62
  let projectRoot;
  if (fs.existsSync(path.join(possibleProjectRoot, 'package.json'))) {
    projectRoot = possibleProjectRoot;
  } else if (fs.existsSync(path.join(possibleProjectRoot, '..', 'package.json'))) {
    projectRoot = path.resolve(possibleProjectRoot, '..');
  } else {
    throw new Error('Error loading app package. Ensure there is a package.json in your app.');
  }

  process.chdir(projectRoot);

  const { exp: config } = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion || typeof runtimeVersion === 'string') {
    // normal runtime versions don't need fingerprinting
    return;
  }

  if (runtimeVersion.policy !== 'fingerprintExperimental') {
    // not a policy that needs fingerprinting
    return;
  }

  const workflow = await resolveWorkflowAsync(projectRoot, platform);
  const fingerprint = await createFingerprintAsync(projectRoot, platform, workflow, {});

  console.log(JSON.stringify(fingerprint.sources));

  fs.writeFileSync(path.join(destinationDir, 'fingerprint'), fingerprint.hash);
}
