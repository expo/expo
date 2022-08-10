import assert from 'assert';

export type LanguageOptions = {
  isTS: boolean;
  isModern: boolean;
  isReact: boolean;
};

export function getExtensions(
  platforms: string[],
  extensions: string[],
  workflows: string[]
): string[] {
  // In the past we used spread operators to collect the values so now we enforce type safety on them.
  assert(Array.isArray(platforms), 'Expected: `platforms: string[]`');
  assert(Array.isArray(extensions), 'Expected: `extensions: string[]`');
  assert(Array.isArray(workflows), 'Expected: `workflows: string[]`');

  const fileExtensions = [];
  // support .expo files
  for (const workflow of [...workflows, '']) {
    // Ensure order is correct: [platformA.js, platformB.js, js]
    for (const platform of [...platforms, '']) {
      // Support both TypeScript and JavaScript
      for (const extension of extensions) {
        fileExtensions.push([platform, workflow, extension].filter(Boolean).join('.'));
      }
    }
  }
  return fileExtensions;
}

export function getLanguageExtensionsInOrder({
  isTS,
  isModern,
  isReact,
}: LanguageOptions): string[] {
  // @ts-ignore: filter removes false type
  const addLanguage = (lang: string): string[] => [lang, isReact && `${lang}x`].filter(Boolean);

  // Support JavaScript
  let extensions = addLanguage('js');

  if (isModern) {
    extensions.unshift('mjs');
  }
  if (isTS) {
    extensions = [...addLanguage('ts'), ...extensions];
  }

  return extensions;
}

export function getManagedExtensions(
  platforms: string[],
  languageOptions: LanguageOptions = { isTS: true, isModern: true, isReact: true }
): string[] {
  const fileExtensions = getExtensions(platforms, getLanguageExtensionsInOrder(languageOptions), [
    'expo',
  ]);
  // Always add these last
  _addMiscellaneousExtensions(platforms, fileExtensions);
  return fileExtensions;
}

export function getBareExtensions(
  platforms: string[],
  languageOptions: LanguageOptions = { isTS: true, isModern: true, isReact: true }
): string[] {
  const fileExtensions = getExtensions(
    platforms,
    getLanguageExtensionsInOrder(languageOptions),
    []
  );
  // Always add these last
  _addMiscellaneousExtensions(platforms, fileExtensions);
  return fileExtensions;
}

function _addMiscellaneousExtensions(platforms: string[], fileExtensions: string[]): string[] {
  // Always add these with no platform extension
  // In the future we may want to add platform and workspace extensions to json.
  fileExtensions.push('json');
  // Native doesn't currently support web assembly.
  if (platforms.includes('web')) {
    fileExtensions.push('wasm');
  }
  return fileExtensions;
}
