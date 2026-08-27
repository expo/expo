import {
  consumeConfigEnvMode,
  getOriginalEnv,
  loadProjectEnv,
  logLoadedEnv,
  setNodeEnv,
  type EnvMode,
} from '@expo/env';
import assert from 'assert';
import { boolish } from 'getenv';

import { createFingerprintForBuildAsync } from './createFingerprintForBuildAsync';
import { createManifestForBuildAsync } from './createManifestForBuildAsync';
import { findUpProjectRoot } from './findUpProjectRoot';

declare namespace globalThis {
  let __DEV__: boolean | undefined;
}

export function loadEnvForBuild(projectRoot: string): EnvMode {
  process.env = getOriginalEnv();
  const mode =
    consumeConfigEnvMode() ?? (boolish('EAS_BUILD', false) ? 'production' : 'development');

  setNodeEnv(mode);
  globalThis.__DEV__ = mode === 'development';
  logLoadedEnv(loadProjectEnv(projectRoot, { mode }));
  return mode;
}

export async function createUpdatesResourcesAsync(args: string[] = process.argv.slice(2)) {
  const platform = args[0] as 'ios' | 'android';
  if (!['ios', 'android'].includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const projectRootArg = args[1];
  assert(projectRootArg, 'Must provide a valid project root');

  const possibleProjectRoot = findUpProjectRoot(projectRootArg);
  assert(possibleProjectRoot, 'Must provide a valid project root');

  const destinationDir = args[2];
  assert(destinationDir, 'Must provide a valid destination directory');

  const createUpdatesResourcesMode = args[3];

  if (
    createUpdatesResourcesMode == null ||
    !['all', 'only-fingerprint'].includes(createUpdatesResourcesMode)
  ) {
    throw new Error(`Unsupported createUpdatesResourcesMode: ${createUpdatesResourcesMode}`);
  }

  const entryFileArg = args[4];
  const mode = loadEnvForBuild(possibleProjectRoot);

  await Promise.all([
    createUpdatesResourcesMode === 'all'
      ? createManifestForBuildAsync(
          platform,
          possibleProjectRoot,
          destinationDir,
          mode,
          entryFileArg
        )
      : null,
    createFingerprintForBuildAsync(platform, possibleProjectRoot, destinationDir),
  ]);
}

if (require.main === module) {
  createUpdatesResourcesAsync().catch((e) => {
    // Wrap in regex to make it easier for log parsers (like `@expo/xcpretty`) to find this error.
    e.message = `@build-script-error-begin\n${e.message}\n@build-script-error-end\n`;
    console.error(e);
    process.exit(1);
  });
}
