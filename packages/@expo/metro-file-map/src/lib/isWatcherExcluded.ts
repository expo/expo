/**
 * Copyright (c) 650 Industries, Inc. (Expo).
 */

// `.git` and `.hg` directories are never crawled or watched, whatever the
// `ignorePattern`. `.cxx` (Android native build output) is ephemeral, and is
// always safe to ignore.
const EXCLUDED_DIR_SEGMENT = /(?:^|[/\\])\.(?:git|hg|cxx)[/\\]/;

/**
 * Whether a path, absolute or relative, is inside a `.git`, `.hg` or `.cxx`
 * directory. The directory's own path (with no trailing separator) doesn't
 * match: see `isWatcherExcludedDirName`.
 */
export default function isWatcherExcluded(filePath: string): boolean {
  return EXCLUDED_DIR_SEGMENT.test(filePath);
}

/**
 * Whether a directory with this basename is excluded, along with everything
 * beneath it.
 */
export function isWatcherExcludedDirName(name: string): boolean {
  return name === '.git' || name === '.hg' || name === '.cxx';
}
