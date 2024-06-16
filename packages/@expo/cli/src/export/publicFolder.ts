import fs from 'fs';
import path from 'path';

import { copyAsync } from '../utils/dir';
import { env } from '../utils/env';

const debug = require('debug')('expo:public-folder') as typeof console.log;

/** @returns the file system path for a user-defined file in the public folder. */
export function getUserDefinedFile(projectRoot: string, possiblePaths: string[]): string | null {
  const publicPath = path.join(projectRoot, env.EXPO_PUBLIC_FOLDER);

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
 * This enables users to add static files like `favicon.ico` or `serve.json`.
 *
 * The contents of this folder are completely universal since they refer to
 * static network requests which fall outside the scope of React Native's magic
 * platform resolution patterns.
 */
export async function copyPublicFolderAsync(publicFolder: string, outputFolder: string) {
  if (fs.existsSync(publicFolder)) {
    await copyAsync(publicFolder, outputFolder);
  }
}
