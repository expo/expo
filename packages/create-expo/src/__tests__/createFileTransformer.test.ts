import { TarTypeFlag } from 'multitars';

import { createEntryRenamer, createGlobFilter, sanitizedName } from '../createFileTransform';

describe(sanitizedName, () => {
  // The same table as in `@expo/config-plugins` (ios/utils/__tests__/Xcodeproj-test.ts):
  // the two implementations must stay in sync.
  it.each([
    // plain names pass through
    ['bacon', 'bacon'],
    // diacritics decompose via NFKD and keep their base letters
    ['Árbók', 'Arbok'],
    ['Pěkná applikačka', 'Peknaapplikacka'],
    // letters that slugify has no charmap entry for survive via NFKD
    ['Ċittadin', 'Cittadin'],
    ['Ǻpp', 'App'],
    // compatibility letters and numbers decompose via NFKD
    ['Ǉubljana', 'LJubljana'],
    ['ﬁre', 'fire'],
    ['Ｅｘｐｏ', 'Expo'],
    ['x² app', 'x2app'],
    // letters that NFKD cannot decompose are transliterated by slugify
    ['Æøå', 'AEoa'],
    ['Łódź', 'Lodz'],
    ['Straße', 'Strasse'],
    ['Привет', 'Privet'],
    // symbols are stripped, not transliterated
    ['A & B', 'AB'],
    ['Expo®', 'Expo'],
    ['Priçe €10', 'Price10'],
    ['h"&<world/>🚀', 'hworld'],
    // symbol-only names fall back to a slugify of the full name
    ['♥', 'love'],
    // nothing usable remains
    ['あいう', 'app'],
  ])(`sanitizes %j to %j`, (name, expected) => {
    expect(sanitizedName(name)).toBe(expected);
  });
});

describe(createEntryRenamer, () => {
  const rename = createEntryRenamer('');

  it(`lowercases android paths after sanitizing, matching content renames`, () => {
    const renameApp = createEntryRenamer('Ǉubljana');
    expect(renameApp('android/app/src/main/java/com/HelloWorld/x.kt', TarTypeFlag.FILE)).toEqual(
      'android/app/src/main/java/com/ljubljana/x.kt'
    );
    expect(renameApp('android/app/src/main/java/com/helloworld/x.kt', TarTypeFlag.FILE)).toEqual(
      'android/app/src/main/java/com/ljubljana/x.kt'
    );
  });

  it(`renames _vscode to .vscode`, () => {
    expect(rename('package/_vscode/', TarTypeFlag.FILE)).toEqual('package/.vscode/');
  });
  it(`renames files within _vscode to .vscode`, () => {
    expect(rename('package/_vscode/settings.json', TarTypeFlag.FILE)).toEqual(
      'package/.vscode/settings.json'
    );
  });
  it(`does not rename extraneous _ segments`, () => {
    expect(rename('_package/_vscode/settings.json', TarTypeFlag.FILE)).toEqual(
      '_package/.vscode/settings.json'
    );
  });
  it(`does not rename multiple instances of _vscode`, () => {
    expect(rename('_package/_vscode/foo/_vscode/settings.json', TarTypeFlag.FILE)).toEqual(
      '_package/.vscode/foo/_vscode/settings.json'
    );
  });
});

describe(createGlobFilter, () => {
  it('returns true for files within glob pattern', () => {
    expect(createGlobFilter('**/*.js')('index.js')).toBe(true);
    expect(createGlobFilter('specific-file.json')('specific-file.json')).toBe(true);
    expect(createGlobFilter('*/templates/package.json')('github-root/templates/package.json')).toBe(
      true
    );
  });

  it('returns false for files outside glob pattern', () => {
    expect(createGlobFilter('**/*.js')('somefile.kt')).toBe(false);
    expect(createGlobFilter('specific-file.json')('not-it.json')).toBe(false);
    expect(createGlobFilter('*/templates/package.json')('package.json')).toBe(false);

    // Dotfiles are ignored by default
    expect(createGlobFilter('**/*')('.npmignore')).toBe(false);
  });
});
