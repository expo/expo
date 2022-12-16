import { ExpoAppManifest, getConfig } from '@expo/config';

import { env } from '../utils/env';
import { CommandError } from '../utils/errors';
import { getResolvedLocalesAsync } from './getResolvedLocales';

/** Get the public Expo manifest from the local project config. */
export async function getPublicExpoManifestAsync(projectRoot: string): Promise<ExpoAppManifest> {
  // Read the config in public mode which strips the `hooks`.
  const { exp } = getConfig(projectRoot, {
    isPublicConfig: true,
    // This shouldn't be needed since the CLI is vendored in `expo`.
    skipSDKVersionRequirement: true,
  });

  // Only allow projects to be published with UNVERSIONED if a correct token is set in env
  if (exp.sdkVersion === 'UNVERSIONED' && !env.EXPO_SKIP_MANIFEST_VALIDATION_TOKEN) {
    throw new CommandError('INVALID_OPTIONS', 'Cannot publish with sdkVersion UNVERSIONED.');
  }

  return {
    ...exp,
    locales: await getResolvedLocalesAsync(projectRoot, exp),
    sdkVersion: exp.sdkVersion!,
  };
}
