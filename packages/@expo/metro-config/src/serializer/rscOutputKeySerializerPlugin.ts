/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ExpoSerializerOptions } from './fork/baseJSBundle';

type SerializerParameters = [
  string,
  readonly Module<MixedOutput>[],
  ReadOnlyGraph,
  ExpoSerializerOptions,
];

const debug = require('debug')('expo:rsc-output-key') as typeof console.log;

/**
 * Convert Windows paths to POSIX format for consistent output keys.
 */
function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if a file URL is valid for the current platform.
 * On Windows, file URLs must have a drive letter (e.g., file:///C:/path).
 */
function isValidFileUrl(fileUrl: string): boolean {
  if (process.platform === 'win32') {
    // Windows requires drive letter: file:///C:/... or file:///D:/...
    return /^file:\/\/\/[a-zA-Z]:\//.test(fileUrl);
  }
  // Unix: file:///path is always valid
  return true;
}

/**
 * Resolve a file:// URL to an output key.
 *
 * - Package files (node_modules): returns path after last /node_modules/
 *   This handles pnpm's .pnpm directory structure by using lastIndexOf.
 * - App files: returns a relative path from project root (e.g., "./app/components/Button.tsx")
 *
 * The output key format must match the SSR manifest generation in MetroBundlerDevServer.ts
 * to ensure consistency between react-server and client bundles.
 */
function resolveOutputKey(fileUrl: string, projectRoot: string): string {
  const absolutePath = fileURLToPath(fileUrl);
  // Normalize to POSIX for consistent string operations across platforms
  const posixPath = toPosixPath(absolutePath);

  // Package files: use path after last /node_modules/
  // This handles pnpm's structure: node_modules/.pnpm/pkg@1.0/node_modules/pkg/...
  // lastIndexOf ensures we get "pkg/..." not ".pnpm/pkg@1.0/node_modules/pkg/..."
  if (posixPath.includes('/node_modules/')) {
    const nodeModulesIndex = posixPath.lastIndexOf('/node_modules/');
    const packageRelativePath = posixPath.slice(nodeModulesIndex + '/node_modules/'.length);
    debug('Resolved %s -> %s (node_modules)', fileUrl, packageRelativePath);
    return packageRelativePath;
  }

  // App files: use relative path from project root
  const relativePath = './' + toPosixPath(path.relative(projectRoot, absolutePath));
  debug('Resolved %s -> %s (app, base=%s)', fileUrl, relativePath, projectRoot);
  return relativePath;
}

/**
 * Replace file:// URLs in the code with stable output keys.
 *
 * Only replaces URLs that point to files within the server root (monorepo root).
 * This avoids transforming unrelated file:// URLs in test code or other contexts.
 *
 * Matches patterns like:
 * - createClientModuleProxy("file:///path/to/project/file.js")
 * - createServerReference("file:///path/to/project/file.js#exportName", ...)
 */
function replaceFileUrlsInCode(code: string, projectRoot: string, serverRoot: string): string {
  // Match file:// URLs with absolute paths (file:///absolute/path)
  // Only match URLs with three slashes (Unix absolute path) to avoid matching
  // template literals like `file://${variable}` in bundled code.
  // The URL may have a hash fragment for server action exports.
  return code.replace(/file:\/\/\/[^"'#`]+(?:#[^"'`]*)?/g, (match) => {
    // Split off the hash fragment if present (for server actions: "file://...#exportName")
    const hashIndex = match.indexOf('#');
    const fileUrl = hashIndex >= 0 ? match.substring(0, hashIndex) : match;
    const hash = hashIndex >= 0 ? match.substring(hashIndex) : '';

    // Skip invalid file URLs (e.g., file:///android_res/ on Windows lacks drive letter)
    if (!isValidFileUrl(fileUrl)) {
      return match;
    }

    // Only transform URLs that point to files within the server root (monorepo root)
    // This includes packages folder in monorepo setups
    const absolutePath = fileURLToPath(fileUrl);
    // Normalize to POSIX for consistent comparison across platforms
    const posixAbsolutePath = toPosixPath(absolutePath);
    const posixServerRoot = toPosixPath(serverRoot);
    if (!posixAbsolutePath.startsWith(posixServerRoot)) {
      return match; // Keep original, not a project file
    }

    const outputKey = resolveOutputKey(fileUrl, serverRoot);
    return outputKey + hash;
  });
}

/**
 * Serializer plugin that replaces file:// URL placeholders with stable output keys.
 *
 * This plugin runs after reconcileTransformSerializerPlugin and replaces file:// URLs
 * (inserted by babel plugins) with stable output keys.
 *
 * Why this approach?
 * 1. Babel runs in worker processes without access to the dependency graph
 * 2. The serializer runs in the main process and can normalize paths
 *
 * The output key format:
 * - node_modules files: path after last /node_modules/ (handles pnpm)
 * - app files: ./ + relative path from project root
 *
 * This must match the SSR manifest generation in MetroBundlerDevServer.ts.
 */
export async function rscOutputKeySerializerPlugin(
  entryPoint: string,
  preModules: readonly Module<MixedOutput>[],
  graph: ReadOnlyGraph,
  options: ExpoSerializerOptions
): Promise<SerializerParameters> {
  const projectRoot = options.projectRoot;

  if (!projectRoot) {
    debug('No projectRoot found, skipping RSC output key resolution');
    return [entryPoint, preModules, graph, options];
  }

  // Get the server root (monorepo root) for resolving packages outside projectRoot
  const serverRoot = getMetroServerRoot(projectRoot);
  debug('projectRoot: %s, serverRoot: %s', projectRoot, serverRoot);
  const environment = graph.transformOptions?.customTransformOptions?.environment;

  // Replace file:// URLs in each module's code
  for (const module of graph.dependencies.values()) {
    for (const output of module.output) {
      if ('code' in output.data && typeof output.data.code === 'string') {
        const originalCode = output.data.code;
        const newCode = replaceFileUrlsInCode(originalCode, projectRoot, serverRoot);

        if (newCode !== originalCode) {
          debug('Replaced file:// URLs in %s (env=%s)', module.path, environment);
          (output.data as { code: string }).code = newCode;
        }
      }
    }
  }

  debug('Replaced file:// URLs with output keys (env=%s)', environment);

  return [entryPoint, preModules, graph, options];
}
