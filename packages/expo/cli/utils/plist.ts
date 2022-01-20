import plist from '@expo/plist';
// @ts-ignore
import binaryPlist from 'bplist-parser';
import fs from 'fs';

const CHAR_CHEVRON_OPEN = 60;
const CHAR_B_LOWER = 98;
// .mobileprovision
// const CHAR_ZERO = 30;

export async function parseBinaryPlistAsync(plistPath: string) {
  return parsePlistBuffer(await fs.promises.readFile(plistPath));
}

export function parsePlistBuffer(contents: Buffer) {
  if (contents[0] === CHAR_CHEVRON_OPEN) {
    const info = plist.parse(contents.toString());
    if (Array.isArray(info)) return info[0];
    return info;
  } else if (contents[0] === CHAR_B_LOWER) {
    const info = binaryPlist.parseBuffer(contents);
    if (Array.isArray(info)) return info[0];
    return info;
  } else {
    throw new Error(`Cannot parse plist of type byte (0x${contents[0].toString(16)})`);
  }
}
