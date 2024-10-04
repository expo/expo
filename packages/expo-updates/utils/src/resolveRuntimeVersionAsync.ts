import { getConfig } from '@expo/config';
import { Updates } from '@expo/config-plugins';
import * as Fingerprint from '@expo/fingerprint';

import { createFingerprintAsync } from './createFingerprintAsync';
import { resolveWorkflowAsync } from './workflow';

export async function resolveRuntimeVersionAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  options: Fingerprint.Options
): Promise<{
  runtimeVersion: string | null;
  fingerprintSources: Fingerprint.FingerprintSource[] | null;
}> {
  const { exp: config } = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion || typeof runtimeVersion === 'string') {
    return { runtimeVersion: runtimeVersion ?? null, fingerprintSources: null };
  }

  const workflow = await resolveWorkflowAsync(projectRoot, platform);

  const policy = runtimeVersion.policy;

  if (policy === 'fingerprintExperimental') {
    const fingerprint = await createFingerprintAsync(projectRoot, platform, workflow, options);
    return { runtimeVersion: fingerprint.hash, fingerprintSources: fingerprint.sources };
  }

  if (workflow !== 'managed') {
    throw new Error(
      `You're currently using the bare workflow, where runtime version policies are not supported. You must set your runtime version manually. For example, define your runtime version as "1.0.0", not {"policy": "appVersion"} in your app config. https://docs.expo.dev/eas-update/runtime-versions`
    );
  }

  return {
    runtimeVersion: await Updates.resolveRuntimeVersionPolicyAsync(policy, config, platform),
    fingerprintSources: null,
  };
}
