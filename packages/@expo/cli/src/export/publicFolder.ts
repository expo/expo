import fs from 'fs';
import path from 'path';

import { copyAsync, isPathInside, maybeRealpathSync } from '../utils/dir';
import { env } from '../utils/env';
import { CommandError } from '../utils/errors';

const debug = require('debug')('expo:public-folder') as typeof console.log;

/**
 * Resolve `EXPO_PUBLIC_FOLDER` against the project root and ensure the result
 * stays inside the project. An `EXPO_PUBLIC_FOLDER` value that escapes
 * (e.g. `../etc`, `/absolute/path`) almost always indicates a misconfigured
 * environment, and if honored would expose unrelated files via every consumer
 * that serves or copies the public folder.
 */
export function getPublicFolderPath(projectRoot: string): string {
  const unresolvedPublicPath = path.resolve(projectRoot, env.EXPO_PUBLIC_FOLDER);
  const publicPath = maybeRealpathSync(unresolvedPublicPath) ?? unresolvedPublicPath;
  if (!isPathInside(publicPath, projectRoot)) {
    throw new CommandError(
      'EXPO_PUBLIC_FOLDER',
      `EXPO_PUBLIC_FOLDER ("${env.EXPO_PUBLIC_FOLDER}") resolves to "${publicPath}", which is outside the project root "${projectRoot}". Set EXPO_PUBLIC_FOLDER to a path inside your project (e.g. "public").`
    );
  }
  return publicPath;
}

/** @returns the file system path for a user-defined file in the public folder. */
export function getUserDefinedFile(projectRoot: string, possiblePaths: string[]): string | null {
  const publicPath = getPublicFolderPath(projectRoot);

  for (const possiblePath of possiblePaths) {
    const fullPath = path.join(publicPath, possiblePath);
    if (fs.existsSync(fullPath)) {
      debug(`Found user-defined public file: ` + possiblePath);
      return fullPath;
    }
  }

  return null;
}

/**
 * Copy the contents of the public folder into the output folder.
 * This enables users to add static files like `favicon.ico`.
 *
 * The contents of this folder are completely universal since they refer to
 * static network requests which fall outside the scope of React Native's magic
 * platform resolution patterns.
 */
export async function copyPublicFolderAsync(publicFolder: string, outputFolder: string) {
  if (fs.existsSync(publicFolder)) {
    await fs.promises.mkdir(outputFolder, { recursive: true });
    await copyAsync(publicFolder, outputFolder);
  }
}
