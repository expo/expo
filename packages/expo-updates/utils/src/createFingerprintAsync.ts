import * as Fingerprint from '@expo/fingerprint';

import { resolveWorkflowAsync } from './workflow';

export async function createFingerprintAsync(
  projectRoot: string,
  platform: 'ios' | 'android'
): Promise<Fingerprint.Fingerprint> {
  const workflow = await resolveWorkflowAsync(projectRoot, platform);

  if (workflow === 'generic') {
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      platforms: [platform],
    });
  } else {
    // ignore everything in native directories to ensure fingerprint is the same
    // no matter whether project has been prebuilt
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      platforms: [platform],
      ignorePaths: ['/android/**/*', '/ios/**/*'],
    });
  }
}
