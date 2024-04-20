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

  if (runtimeVersion.policy !== 'fingerprint') {
    // not a policy that needs fingerprinting
    return;
  }

  let fingerprint: { hash: string };

  const override = process.env.EXPO_UPDATES_FINGERPRINT_OVERRIDE;
  if (override) {
    console.log(`Using fingerprint from EXPO_UPDATES_FINGERPRINT_OVERRIDE: ${override}`);
    fingerprint = { hash: override };
  } else {
    const workflow = await resolveWorkflowAsync(projectRoot, platform);
    const createdFingerprint = await createFingerprintAsync(projectRoot, platform, workflow, {});
    console.log(JSON.stringify(createdFingerprint.sources));
    fingerprint = createdFingerprint;
  }

  fs.writeFileSync(path.join(destinationDir, 'fingerprint'), fingerprint.hash);
}
