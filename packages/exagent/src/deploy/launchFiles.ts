// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy — native delivery goes through
// launch.expo.dev, which takes the project *source* rather than a built binary.
//
// Ported from the reference implementation, `create-launch` (src/utils/files.ts in the launch
// repository): same ignore list, same 500 MB limit, same byte formatting, so a project that
// uploads from one tool uploads from the other. Two deliberate differences: the filesystem paths
// are built with `path.join` and the tar entry names are always posix, because this package runs
// on Windows too.

import fs from 'fs';
import path from 'path';

import { CommandError } from '../utils/errors';

/** Largest upload the Launch service accepts: 500 MB of project source. */
export const LAUNCH_SIZE_LIMIT_BYTES = 524_288_000;

/** One file of the upload. */
export interface UploadFile {
  /** Path inside the tarball, relative to the upload root, always with posix separators. */
  normalizedPath: string;
  /** Absolute path on this machine. */
  path: string;
  /** Size in bytes, as `fs.Stats` reports it. */
  size: number;
}

/** What one upload adds up to, for the size limit and for the summary. */
export interface UploadSummary {
  files: number;
  size: number;
}

/**
 * Whether an entry is left out of the upload.
 *
 * Everything here is either regenerated where the project is built (`node_modules`, native build
 * output), private to this machine (`.expo`, editor backups), or irrelevant to a build (`.git`,
 * macOS metadata). Leaving them out is what keeps a project under the size limit.
 *
 * @param parentPath Path of the containing directory relative to the upload root, posix separated.
 */
export function isIgnoredUploadEntry(name: string, parentPath?: string): boolean {
  switch (name) {
    // macOS system files
    case '.DS_Store':
    case '.AppleDouble':
    case '.Trashes':
    case '__MACOSX':
    case '.LSOverride':
    case '.git': // Git — a build needs the files, not their history
    case '.expo': // Expo internal state of this machine
    case 'node_modules': // installed where the project is built
      return true;
  }

  // Build output, which only counts as such in its own place: a `build` directory of the app
  // itself is source.
  switch (parentPath ? `${parentPath}/${name}` : name) {
    case 'android/.gradle':
    case 'android/.kotlin':
    case 'android/app/.cxx':
    case 'android/app/build':
    case 'ios/Pods':
    case 'ios/build':
      return true;
  }

  // Backup file name convention
  return name.endsWith('~');
}

/** Every file of the upload, walked depth first. */
export function listUploadFilesAsync(uploadRoot: string): AsyncGenerator<UploadFile> {
  async function* recurseAsync(parentPath?: string): AsyncGenerator<UploadFile> {
    const target = parentPath ? path.join(uploadRoot, parentPath) : uploadRoot;
    const entries = await fs.promises.readdir(target, { withFileTypes: true });

    for (const entry of entries) {
      if (isIgnoredUploadEntry(entry.name, parentPath)) {
        continue;
      }
      // A tar entry name is a posix path, whatever the platform that wrote it.
      const normalizedPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        yield* recurseAsync(normalizedPath);
      } else if (entry.isFile()) {
        const absolutePath = path.join(target, entry.name);
        yield {
          normalizedPath,
          path: absolutePath,
          size: (await fs.promises.stat(absolutePath)).size,
        };
      }
      // Anything else (a symlink, a socket) is skipped: the service builds from plain files.
    }
  }

  return recurseAsync();
}

/** Count the upload before sending it, which is what the size limit is checked against. */
export async function summarizeUploadAsync(uploadRoot: string): Promise<UploadSummary> {
  let files = 0;
  let size = 0;
  for await (const file of listUploadFilesAsync(uploadRoot)) {
    files++;
    size += file.size;
  }
  return { files, size };
}

/**
 * Refuse an upload the service would refuse, before spending the minutes it takes to send it.
 *
 * @throws {CommandError} `LAUNCH_EMPTY` when there is nothing to upload, `LAUNCH_SIZE_LIMIT` when
 * it is over the limit.
 */
export function assertUploadableOrThrow(summary: UploadSummary, uploadRoot: string): void {
  if (!summary.files || !summary.size) {
    const error = new CommandError(
      'LAUNCH_EMPTY',
      [
        `There is nothing to upload from ${uploadRoot}, so there is no app to launch.`,
        `Why: every file in that directory is one the upload leaves out (node_modules, .git, .expo, native build output), or the directory is empty.`,
        `How: run this from the project directory, or pass --upload-root <dir> to name the directory that holds the app.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent deploy --native --upload-root .';
    throw error;
  }

  if (summary.size > LAUNCH_SIZE_LIMIT_BYTES) {
    const error = new CommandError(
      'LAUNCH_SIZE_LIMIT',
      [
        `The upload is ${formatByteSize(summary.size)}, and Launch takes at most 500 MB of project source.`,
        `Why: the ${summary.files} files under the upload root add up to more than the service accepts, so the upload would be rejected after minutes of sending it.`,
        `How: move large files out of the project (videos, archives, build output, sample data), then run this command again. "npx exagent deploy --native --upload-root <dir>" uploads one app of a monorepo instead of the whole tree.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent context';
    throw error;
  }
}

/**
 * A byte count as a person reads it.
 *
 * Decimal units, matching the reference implementation, so the number in an exagent error is the
 * number `create-launch` would print for the same project.
 */
export function formatByteSize(bytes: number, decimals = 2): string {
  const threshold = 1000;
  if (Math.abs(bytes) < threshold) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const rounding = 10 ** decimals;
  let unit = -1;
  let value = bytes;

  do {
    value /= threshold;
    unit++;
  } while (
    Math.round(Math.abs(value) * rounding) / rounding >= threshold &&
    unit < units.length - 1
  );

  return `${value.toFixed(decimals)} ${units[unit]}`;
}
