import path from 'path';

import { CommandError } from '../../utils/errors';

export type GradleProps = {
  /** Directory for the APK based on the `variant`. */
  apkVariantDirectory: string;
  /** Name of the app, used in the `apkVariantDirectory`. */
  appName: string;
  /** First section of the provided `variant`, indicates the last part of the file name for the output APK. */
  buildType: string;
  /** Used to assemble the APK, also included in the output APK filename. */
  flavors?: string[];
};

function assertVariant(variant?: string) {
  if (variant && typeof variant !== 'string') {
    throw new CommandError('BAD_ARGS', '--variant must be a string');
  }
  return variant ?? 'debug';
}

export function resolveGradleProps(
  projectRoot: string,
  options: { variant?: string }
): GradleProps {
  const variant = assertVariant(options.variant);
  // NOTE(EvanBacon): Why would this be different? Can we get the different name?
  const appName = 'app';

  const apkDirectory = path.join(projectRoot, 'android', appName, 'build', 'outputs', 'apk');

  // buildDeveloperTrust -> build, developer, trust (where developer, and trust are flavors).
  // This won't work for non-standard flavor names like "myFlavor" would be treated as "my", "flavor".
  const [buildType, ...flavors] = variant.split(/(?=[A-Z])/).map((v) => v.toLowerCase());
  const apkVariantDirectory = path.join(apkDirectory, ...flavors, buildType);

  return {
    appName,
    buildType,
    flavors,
    apkVariantDirectory,
  };
}
