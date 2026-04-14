import { TarTypeFlag } from 'multitars';
import path from 'path';
import picomatch from 'picomatch';

const debug = require('debug')('expo:init:fileTransform') as typeof console.log;

export function sanitizedName(name: string) {
  return name
    .replace(/[\W_]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
      // Rewrite paths for bare workflow
      input = input
        .replace(
          /HelloWorld/g,
          input.includes('android') ? sanitizedName(name.toLowerCase()) : sanitizedName(name)
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
