import { getConfig } from '@expo/config';

import { Log } from '../log';
import { asyncImportInterop } from '../utils/asyncImportInterop';

export async function typescript(projectRoot: string) {
  const { TypeScriptProjectPrerequisite } = asyncImportInterop(
    await import('../start/doctor/typescript/TypeScriptProjectPrerequisite.js')
  );
  const { MetroBundlerDevServer } = asyncImportInterop(
    await import('../start/server/metro/MetroBundlerDevServer.js')
  );
  const { getPlatformBundlers } = asyncImportInterop(
    await import('../start/server/platformBundlers.js')
  );

  try {
    await new TypeScriptProjectPrerequisite(projectRoot).bootstrapAsync();
  } catch (error: any) {
    // Ensure the process doesn't fail if the TypeScript check fails.
    // This could happen during the install.
    Log.log();
    Log.exception(error);
    return;
  }

  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  await new MetroBundlerDevServer(projectRoot, getPlatformBundlers(projectRoot, exp), {
    isDevClient: true,
  }).startTypeScriptServices();
}
