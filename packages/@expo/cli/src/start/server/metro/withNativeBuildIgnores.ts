import path from 'path';

/** Native build output and dependencies in the project, relative to its root */
const PROJECT_NATIVE_BUILD_DIRECTORIES = ['android/app/build', 'android/.gradle', 'ios/Pods'];

/** Matches either path separator, and is valid with every RegExp flag, including `u` and `v` */
const SEPARATOR = '[\\\\\\/]';

function toPatternSource(filePath: string): string {
  return filePath
    .split(/[\\/]/)
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    .join(SEPARATOR);
}

/**
 * Appends patterns to a resolved Metro config's `resolver.blockList` that exclude the project's
 * native build directories (`ios/Pods`, `android/app/build` and `android/.gradle`), and `.cxx`
 * directories anywhere, since native libraries build into `.cxx` inside `node_modules`.
 *
 * They match absolute paths, which is how Metro's crawlers and file map test `blockList`, and they
 * are added after the user's config is merged, so that a config setting its own `blockList` keeps
 * them.
 */
export function withNativeBuildIgnores(
  blockList: RegExp | readonly RegExp[] | null | undefined,
  projectRoot: string
): RegExp[] {
  const patterns = blockList == null ? [] : Array.isArray(blockList) ? blockList : [blockList];
  // Metro combines `blockList` into one pattern, which fails for patterns with different flags
  const flags = patterns[0]?.flags ?? '';
  const root = toPatternSource(path.resolve(projectRoot).replace(/[\\/]+$/, ''));
  const directories = PROJECT_NATIVE_BUILD_DIRECTORIES.map(toPatternSource).join('|');
  return [
    ...patterns,
    new RegExp(`^${root}${SEPARATOR}(?:${directories})$`, flags),
    new RegExp(`(?:^|${SEPARATOR})\\.cxx(?:${SEPARATOR}|$)`, flags),
  ];
}
