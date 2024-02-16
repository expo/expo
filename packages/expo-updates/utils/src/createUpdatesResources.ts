import assert from 'assert';

import { createFingerprintForBuildAsync } from './createFingerprintForBuildAsync';
import { createManifestForBuildAsync } from './createManifestForBuildAsync';
import { findUpProjectRoot } from './findUpProjectRoot';

(async function () {
  const platform = process.argv[2] as 'ios' | 'android';
  if (!['ios', 'android'].includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const projectRootArg = process.argv[3];
  assert(projectRootArg, 'Must provide a valid project root');

  const possibleProjectRoot = findUpProjectRoot(projectRootArg);
  assert(possibleProjectRoot, 'Must provide a valid project root');

  const destinationDir = process.argv[4];
  assert(destinationDir, 'Must provide a valid destination directory');

  const createUpdatesResourcesMode = process.argv[5];
  if (!['all', 'only-fingerprint'].includes(createUpdatesResourcesMode)) {
    throw new Error(`Unsupported createUpdatesResourcesMode: ${createUpdatesResourcesMode}`);
  }

  const entryFileArg = process.argv[6];

  await Promise.all([
    createUpdatesResourcesMode === 'all'
      ? createManifestForBuildAsync(platform, possibleProjectRoot, destinationDir, entryFileArg)
      : null,
    createFingerprintForBuildAsync(platform, possibleProjectRoot, destinationDir),
  ]);
})().catch((e) => {
  // Wrap in regex to make it easier for log parsers (like `@expo/xcpretty`) to find this error.
  e.message = `@build-script-error-begin\n${e.message}\n@build-script-error-end\n`;
  console.error(e);
  process.exit(1);
});
