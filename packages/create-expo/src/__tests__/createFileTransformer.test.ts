import { TarTypeFlag } from 'multitars';

import { createEntryRenamer, createGlobFilter } from '../createFileTransform';

describe(createEntryRenamer, () => {
  const rename = createEntryRenamer('');

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
