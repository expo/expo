import { TarTypeFlag } from 'multitars';
import path from 'path';
import picomatch from 'picomatch';
import slugify from 'slugify';

const debug = require('debug')('expo:init:fileTransform') as typeof console.log;

const NEITHER_LETTER_NOR_NUMBER = /[^\p{L}\p{N}]+/gu;
const COMBINING_MARKS = /\p{M}+/gu;
const NOT_ASCII_ALPHANUMERIC = /[\W_]+/g;

/**
 * Returns an ASCII identifier for `name`, used as the native project and target name.
 * Symbols carry no name information and are dropped ('A & B' -> 'AB', 'Expo®' -> 'Expo').
 * Letters keep their base form ('Árbók' -> 'Arbok', 'Æøå' -> 'AEoa', 'Ǉubljana' -> 'LJubljana').
 * A name with no usable letters falls back to a slugify of the whole name
 * ('♥' -> 'love'), then to 'app'.
 *
 * Keep in sync with `sanitizedName` in `@expo/config-plugins` (src/ios/utils/Xcodeproj.ts)
 * so create-expo and prebuild derive the same project name.
 */
export function sanitizedName(name: string) {
  // NFKD before slugify, or letters are lost: 'Ċ' decomposes to 'C' + a combining mark
  // that the next line drops, while slugify deletes it outright.
  const lettersAndNumbers = name
    .replace(NEITHER_LETTER_NOR_NUMBER, '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '');
  return toAsciiIdentifier(slugify(lettersAndNumbers)) || toAsciiIdentifier(slugify(name)) || 'app';
}

function toAsciiIdentifier(name: string) {
  return name.replace(NOT_ASCII_ALPHANUMERIC, '');
}

// Directories that can be added to the template with an underscore instead of a dot, e.g. `.vscode` and be added with `_vscode`.
const SUPPORTED_DIRECTORIES = ['eas', 'vscode', 'github', 'cursor'];
const SUPPORTED_DIRECTORIES_PATTERN = new RegExp(
  `(^|/|\\\\)_(${SUPPORTED_DIRECTORIES.join('|')})(/|\\\\|$)`
);

function renameDirectories(input: string, typeflag: TarTypeFlag): string {
  if (typeflag === TarTypeFlag.FILE || typeflag === TarTypeFlag.DIRECTORY) {
    // Detect if the file contains one of the supported directories
    // and rename it to the correct format.
    // For example, if the file is `_vscode`, we want to rename it to `.vscode`.
    input = input.replace(SUPPORTED_DIRECTORIES_PATTERN, (match, p1, p2, p3) => `${p1}.${p2}${p3}`);
  }
  return input;
}

function renameConfigs(input: string, typeflag: TarTypeFlag): string {
  if (typeflag === TarTypeFlag.FILE && path.basename(input) === 'gitignore') {
    // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
    // See: https://github.com/npm/npm/issues/1862
    input = input.replace(/gitignore$/, '.gitignore');
  }
  return input;
}

export function createEntryRenamer(name: string) {
  return (input: string, typeflag: TarTypeFlag): string => {
    if (name) {
      // Rewrite paths for bare workflow. Lowercase after sanitizing so the result
      // always matches content renames (slugify's charmap is case-asymmetric).
      input = input
        .replace(
          /HelloWorld/g,
          input.includes('android') ? sanitizedName(name).toLowerCase() : sanitizedName(name)
        )
        .replace(/helloworld/g, sanitizedName(name).toLowerCase());
    }
    input = renameConfigs(input, typeflag);
    input = renameDirectories(input, typeflag);
    return input;
  };
}

export function createGlobFilter(
  globPattern: picomatch.Glob,
  options?: picomatch.PicomatchOptions
) {
  const matcher = picomatch(globPattern, options);

  debug('filter: created for pattern %s (%s)', globPattern);

  return (path: string) => {
    const included = matcher(path);
    debug('filter: %s - %s', included ? 'include' : 'exclude', path);
    return included;
  };
}
