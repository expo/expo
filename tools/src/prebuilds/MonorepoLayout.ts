/**
 * Where the expo/expo monorepo builds its precompiled artifacts. This layout lives with the
 * producer rather than in `expo-modules-autolinking`, because the published package describes
 * the artifact grammar and must not encode the shape of this repository.
 */

import path from 'path';

const PRECOMPILE_BUILD_DIR = '.build';
const SHARED_SPM_DEPS_SOURCE_DIR = '.spm-deps';

/** Directory the monorepo builds every precompiled package under. */
export function getMonorepoBuildDir(repoRoot: string): string {
  return path.join(repoRoot, 'packages', 'precompile', PRECOMPILE_BUILD_DIR);
}

/** Build path of one package within the monorepo build directory. */
export function getPackageBuildDir(repoRoot: string, npmPackage: string): string {
  return path.join(getMonorepoBuildDir(repoRoot), npmPackage);
}

/** Directory the producer writes every shared SPM dependency of the monorepo into. */
export function getSharedSpmDepsRoot(repoRoot: string): string {
  return path.join(getMonorepoBuildDir(repoRoot), SHARED_SPM_DEPS_SOURCE_DIR);
}
