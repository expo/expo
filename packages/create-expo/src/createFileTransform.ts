import { TarTypeFlag } from 'multitars';
import path from 'path';
import picomatch from 'picomatch';
import slugify from 'slugify';

const debug = require('debug')('expo:init:fileTransform') as typeof console.log;

// Keep in sync with `sanitizedName` in `@expo/config-plugins` (src/ios/utils/Xcodeproj.ts)
// so create-expo and prebuild derive the same project name.
// Symbols are dropped so 'A & B' stays 'AB' and 'Expo®' stays 'Expo'. Diacritics
// are stripped via NFKD before slugify, because slugify deletes letters absent from
// its charmap ('Ċ' would vanish instead of becoming 'C'). NFKD also decomposes
// compatibility letters and numbers ('ﬁ' becomes 'fi', 'Ǉ' becomes 'LJ', fullwidth
// 'Ｅ' becomes 'E'); symbols like '™' are already dropped, so they do not turn into
// letters. slugify then transliterates letters that NFKD cannot decompose
// (ø, æ, ł, ß). Symbol-only names fall back to a slugify of the full name
// ('♥' becomes 'love').
export function sanitizedName(name: string) {
  const lettersAndNumbers = name
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '');
  return (
    sanitizedNameForProjects(slugify(lettersAndNumbers)) ||
    sanitizedNameForProjects(slugify(name)) ||
    'app'
  );
}

// Normalize before stripping so diacritics decompose into combining marks that `\W` removes,
// keeping the base letters ("\u00c1rb\u00f3k" -> "Arbok", not "rbk").
function sanitizedNameForProjects(name: string) {
  return name.normalize('NFKD').replace(/[\W_]+/g, '');
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
