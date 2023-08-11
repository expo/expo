import plist from '@expo/plist';
import binaryPlist from 'bplist-parser';
import fs from 'fs/promises';

import { CommandError } from './errors';
import * as Log from '../log';

const CHAR_CHEVRON_OPEN = 60;
const CHAR_B_LOWER = 98;
// .mobileprovision
// const CHAR_ZERO = 30;

export async function parsePlistAsync(plistPath: string) {
  Log.debug(`Parse plist: ${plistPath}`);

  return parsePlistBuffer(await fs.readFile(plistPath));
}

export function parsePlistBuffer(contents: Buffer) {
  if (contents[0] === CHAR_CHEVRON_OPEN) {
    const info = plist.parse(contents.toString());
    if (Array.isArray(info)) return info[0];
    return info;
  } else if (contents[0] === CHAR_B_LOWER) {
    // @ts-expect-error
    const info = binaryPlist.parseBuffer(contents);
    if (Array.isArray(info)) return info[0];
    return info;
  } else {
    throw new CommandError(
      'PLIST',
      `Cannot parse plist of type byte (0x${contents[0].toString(16)})`
    );
  }
}
