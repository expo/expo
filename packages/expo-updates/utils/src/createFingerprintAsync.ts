import * as Fingerprint from 'expo/fingerprint';

import { Workflow } from './workflow';

export async function createFingerprintAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  workflow: Workflow,
  options: Fingerprint.Options
): Promise<Fingerprint.Fingerprint> {
  if (workflow === 'generic') {
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      ...options,
      platforms: [platform],
    });
  } else {
    // ignore everything in native directories to ensure fingerprint is the same
    // no matter whether project has been prebuilt
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      ...options,
      platforms: [platform],
      ignorePaths: ['android/**/*', 'ios/**/*'],
    });
  }
}
