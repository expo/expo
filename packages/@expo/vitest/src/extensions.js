// @ts-check
// Port of `jest-expo/config/extensions.js` (which mirrors `@expo/config/src/paths/extensions.ts`).
// Produces Metro-ordered file extensions for a set of platforms, e.g. for `['ios', 'native']`:
// `ios.ts, ios.tsx, ios.js, ios.jsx, native.ts, ..., ts, tsx, js, jsx, json`.

/**
 * @param {string[]} platforms
 * @param {string[]} extensions
 * @returns {string[]}
 */
function getExtensions(platforms, extensions) {
  const fileExtensions = [];
  // Ensure order is correct: [platformA.js, platformB.js, js]
  for (const platform of [...platforms, '']) {
    for (const extension of extensions) {
      fileExtensions.push([platform, extension].filter(Boolean).join('.'));
    }
  }
  return fileExtensions;
}

/**
 * @param {{ isTS: boolean, isModern: boolean, isReact: boolean }} options
 * @returns {string[]}
 */
function getLanguageExtensionsInOrder({ isTS, isModern, isReact }) {
  /** @param {string} lang */
  const addLanguage = (lang) => (isReact ? [lang, `${lang}x`] : [lang]);

  let extensions = addLanguage('js');
  if (isModern) {
    extensions.unshift('mjs');
  }
  if (isTS) {
    extensions = [...addLanguage('ts'), ...extensions];
  }
  return extensions;
}

/**
 * Bare (no leading dot) extensions in Metro resolution order.
 *
 * @param {string[]} platforms e.g. `['ios', 'native']`
 * @param {{ isTS?: boolean, isModern?: boolean, isReact?: boolean }} [languageOptions]
 * @returns {string[]}
 */
export function getBareExtensions(
  platforms,
  languageOptions = { isTS: true, isModern: false, isReact: true }
) {
  const fileExtensions = getExtensions(
    platforms,
    getLanguageExtensionsInOrder({
      isTS: languageOptions.isTS ?? true,
      isModern: languageOptions.isModern ?? false,
      isReact: languageOptions.isReact ?? true,
    })
  );
  // Always add these last. Native doesn't currently support web assembly.
  fileExtensions.push('json');
  if (platforms.includes('web')) {
    fileExtensions.push('wasm');
  }
  return fileExtensions;
}

/**
 * The same list with leading dots, as Vite's `resolve.extensions` expects.
 *
 * @param {string[]} platforms
 * @returns {string[]}
 */
export function getViteExtensions(platforms) {
  return getBareExtensions(platforms).map((ext) => `.${ext}`);
}

/**
 * Platform extension list for a Jest-style project. Mirrors `jest-expo/config/getPlatformPreset`.
 *
 * @param {'ios' | 'android' | 'web' | 'node'} platform
 * @returns {string[]}
 */
export function getPlatformExtensions(platform) {
  switch (platform) {
    case 'ios':
      return ['ios', 'native'];
    case 'android':
      return ['android', 'native'];
    case 'web':
      return ['web'];
    case 'node':
      return ['node', 'web'];
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Asset extensions that Metro treats as assets (kept in sync with `jest-expo/jest-preset.js`).
 * Importing one of these resolves to a stub module instead of the file contents.
 */
export const ASSET_EXTENSIONS = [
  // Image formats
  'bmp',
  'gif',
  'jpg',
  'jpeg',
  'png',
  'psd',
  'svg',
  'webp',
  'xml',
  // Video formats
  'm4v',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'webm',
  // Audio formats
  'aac',
  'aiff',
  'caf',
  'm4a',
  'mp3',
  'wav',
  // Document formats
  'html',
  'pdf',
  'yaml',
  'yml',
  // Font formats
  'otf',
  'ttf',
  // Archives (virtual files)
  'zip',
  // `expo-image` file types.
  'heic',
  'avif',
  // `expo-sqlite` file types.
  'db',
];
