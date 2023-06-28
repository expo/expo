import fs from 'fs';
import path from 'path';

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
