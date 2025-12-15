import path from 'path';
import picomatch from 'picomatch';
import type { ReadEntry } from 'tar';

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

function applyNameDuringPipe(entry: Pick<ReadEntry, 'path'>, name: string) {
  if (name) {
    // Rewrite paths for bare workflow
    entry.path = entry.path
      .replace(
        /HelloWorld/g,
        entry.path.includes('android') ? sanitizedName(name.toLowerCase()) : sanitizedName(name)
      )
      .replace(/helloworld/g, sanitizedName(name).toLowerCase());
  }
  return entry;
}

const ENTRY_FILE_PATTERN = /^file$/i;
const ENTRY_FILE_OR_DIRECTORY_PATTERN = /^(file|directory)$/i;

export function modifyFileDuringPipe(entry: Pick<ReadEntry, 'path' | 'type'>) {
  if (!entry.type) return entry;

  if (ENTRY_FILE_PATTERN.test(entry.type) && path.basename(entry.path) === 'gitignore') {
    // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
    // See: https://github.com/npm/npm/issues/1862
    entry.path = entry.path.replace(/gitignore$/, '.gitignore');
  }

  if (ENTRY_FILE_OR_DIRECTORY_PATTERN.test(entry.type)) {
    // Detect if the file contains one of the supported directories
    // and rename it to the correct format.
    // For example, if the file is `_vscode`, we want to rename it to `.vscode`.

    // Match one instance of the supported directory name, starting with an underscore, and containing slashes on both sides.
    entry.path = entry.path.replace(
      SUPPORTED_DIRECTORIES_PATTERN,
      (match, p1, p2, p3) => `${p1}.${p2}${p3}`
    );
  }

  return entry;
}

export function createEntryResolver(name: string) {
  return (entry: ReadEntry) => {
    applyNameDuringPipe(entry, name);
    modifyFileDuringPipe(entry);
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
