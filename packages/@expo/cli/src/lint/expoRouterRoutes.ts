import { getConfig } from '@expo/config';
import { glob } from 'glob';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getRouterDirectoryModuleIdWithManifest } from '../start/server/metro/router';
import { directoryExistsSync } from '../utils/dir';

export const PLATFORM_ROUTES_DOCS_URL =
  'https://docs.expo.dev/router/advanced/platform-specific-modules/';

// Platform extensions Metro resolves. Mirrors `validPlatforms` in expo-router's getRoutesCore.
const PLATFORMS = new Set(['android', 'ios', 'native', 'web']);

// File extensions a route or its fallback can use.
const SOURCE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];

// Special files that are not client routes, so platform extensions on them are irrelevant here.
const NON_ROUTE_FILES = new Set(['+html', '+native-intent', '+middleware']);

export interface PlatformRouteIssue {
  type: 'missing-fallback' | 'api-platform-extension';
  /** Path of the offending file, relative to the router root, using POSIX separators. */
  file: string;
  platform: string;
  /** Route base name with the platform extension removed. */
  base: string;
}

function posixDirname(file: string): string {
  const index = file.lastIndexOf('/');
  return index === -1 ? '' : file.slice(0, index);
}

function posixBasename(file: string): string {
  const index = file.lastIndexOf('/');
  return index === -1 ? file : file.slice(index + 1);
}

/**
 * Given a list of route files (relative to the router root, POSIX separators), find platform-specific
 * routes that would break route generation: those with no non-platform fallback in the same directory,
 * and API routes that carry a platform extension. Reports each missing fallback once per route.
 */
export function findPlatformRouteIssues(routeFiles: string[]): PlatformRouteIssue[] {
  const fileSet = new Set(routeFiles);
  const issues: PlatformRouteIssue[] = [];
  const reportedFallbacks = new Set<string>();

  for (const file of routeFiles) {
    const parts = posixBasename(file).split('.');
    // A platform route looks like `name.<platform>.<ext>`, so we need at least three segments.
    if (parts.length < 3) {
      continue;
    }

    const extension = parts[parts.length - 1];
    const platform = parts[parts.length - 2];
    if (
      !extension ||
      !platform ||
      !SOURCE_EXTENSIONS.includes(extension) ||
      !PLATFORMS.has(platform)
    ) {
      continue;
    }

    const base = parts.slice(0, parts.length - 2).join('.');
    if (!base || NON_ROUTE_FILES.has(base)) {
      continue;
    }

    // API routes can never carry a platform extension, regardless of a fallback.
    if (base.endsWith('+api')) {
      issues.push({ type: 'api-platform-extension', file, platform, base });
      continue;
    }

    const directory = posixDirname(file);
    const routeKey = `${directory}/${base}`;
    if (reportedFallbacks.has(routeKey)) {
      continue;
    }

    const hasFallback = SOURCE_EXTENSIONS.some((ext) =>
      fileSet.has(directory ? `${directory}/${base}.${ext}` : `${base}.${ext}`)
    );
    if (!hasFallback) {
      reportedFallbacks.add(routeKey);
      issues.push({ type: 'missing-fallback', file, platform, base });
    }
  }

  return issues;
}

/** Render a single issue into a human- and agent-readable message. */
export function formatPlatformRouteIssue(issue: PlatformRouteIssue, routerRoot: string): string {
  const location = `${routerRoot}/${issue.file}`;
  if (issue.type === 'api-platform-extension') {
    return (
      `${location}: API routes cannot have platform extensions. ` +
      `Remove ".${issue.platform}" from the filename. See ${PLATFORM_ROUTES_DOCS_URL}`
    );
  }
  return (
    `${location}: platform-specific route ("${issue.platform}") has no non-platform fallback, so the ` +
    `"${issue.base}" route will not exist on other platforms and Expo Router throws when building the ` +
    `route tree. Add a non-platform "${issue.base}" file next to it, or move the screen out of the ` +
    `router directory and re-export it (e.g. export { default } from '@/components/${issue.base}'). ` +
    `See ${PLATFORM_ROUTES_DOCS_URL}`
  );
}

/**
 * Scan an Expo Router project for platform-specific routes that lack a non-platform fallback.
 * Returns `null` when the project does not use Expo Router or has no router directory.
 */
export async function getExpoRouterLintIssuesAsync(
  projectRoot: string
): Promise<{ routerRoot: string; issues: PlatformRouteIssue[] } | null> {
  if (!resolveFrom.silent(projectRoot, 'expo-router/package.json')) {
    return null;
  }

  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });

  const routerRoot = getRouterDirectoryModuleIdWithManifest(projectRoot, exp);
  const absoluteRouterRoot = path.join(projectRoot, routerRoot);
  if (!directoryExistsSync(absoluteRouterRoot)) {
    return null;
  }

  const routeFiles = await glob(`**/*.{${SOURCE_EXTENSIONS.join(',')}}`, {
    cwd: absoluteRouterRoot,
    nodir: true,
    posix: true,
    ignore: ['**/node_modules/**'],
  });

  return { routerRoot, issues: findPlatformRouteIssues(routeFiles) };
}
