import { getConfig } from 'expo/config';
import { Updates } from 'expo/config-plugins';
import * as Fingerprint from 'expo/fingerprint';

import { createFingerprintAsync } from './createFingerprintAsync';
import { Workflow, resolveWorkflowAsync } from './workflow';

export async function resolveRuntimeVersionAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  fingerprintOptions: Fingerprint.Options,
  otherOptions: { workflowOverride?: Workflow }
): Promise<{
  runtimeVersion: string | null;
  fingerprintSources: Fingerprint.FingerprintSource[] | null;
  workflow: 'managed' | 'generic';
}> {
  const { exp: config } = getConfig(projectRoot, {
    isPublicConfig: true,
    skipSDKVersionRequirement: true,
  });

  const workflow =
    otherOptions.workflowOverride ?? (await resolveWorkflowAsync(projectRoot, platform));

  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion || typeof runtimeVersion === 'string') {
    return { runtimeVersion: runtimeVersion ?? null, fingerprintSources: null, workflow };
  }

  if (typeof runtimeVersion !== 'object' || Array.isArray(runtimeVersion)) {
    throw new Error(
      `Invalid runtime version: ${JSON.stringify(runtimeVersion)}. Expected a string or an object with a "policy" key. https://docs.expo.dev/eas-update/runtime-versions`
    );
  }
  const policy = runtimeVersion.policy;

  if (policy === 'fingerprint') {
    const fingerprint = await createFingerprintAsync(
      projectRoot,
      platform,
      workflow,
      fingerprintOptions
    );
    return { runtimeVersion: fingerprint.hash, fingerprintSources: fingerprint.sources, workflow };
  }

  if (workflow !== 'managed') {
    throw new Error(
      `You're currently using the bare workflow, where runtime version policies are not supported. You must set your runtime version manually. For example, define your runtime version as "1.0.0", not {"policy": "appVersion"} in your app config. https://docs.expo.dev/eas-update/runtime-versions`
    );
  }

  return {
    runtimeVersion: await Updates.resolveRuntimeVersionPolicyAsync(policy, config, platform),
    fingerprintSources: null,
    workflow,
  };
}
