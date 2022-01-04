import { vol } from 'memfs';

import { resolveBareEntryFile } from '../createNativeProjectsFromTemplateAsync';

jest.mock('fs');
jest.mock('resolve-from');

describe(resolveBareEntryFile, () => {
  const projectRoot = '/alpha';
  const projectRootBeta = '/beta';

  beforeAll(() => {
    vol.fromJSON(
      {
        'index.js': '',
        'src/index.js': '',
      },
      projectRoot
    );
    vol.fromJSON(
      {
        'App.js': '',
      },
      projectRootBeta
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`resolves null when the app entry is managed`, () => {
    // managed entry points shouldn't even be searched in bare.
    expect(resolveBareEntryFile('/noop', 'node_modules/expo/AppEntry.js')).toEqual(null);
    expect(resolveBareEntryFile('/noop', 'expo/AppEntry.js')).toEqual(null);
  });
  it(`resolves to the provided main field`, () => {
    expect(resolveBareEntryFile(projectRoot, './src/index')).toEqual('/alpha/src/index.js');
    expect(resolveBareEntryFile(projectRoot, './index')).toEqual('/alpha/index.js');
    // Test that the "node_modules" aren't searched.
    expect(resolveBareEntryFile(projectRootBeta, 'App')).toEqual('/beta/App.js');
  });
  // Uses the default file if it exists and isn't defined in the package.json.
  it(`resolves to the existing default main file when no field is defined`, () => {
    expect(resolveBareEntryFile(projectRoot, null)).toEqual('/alpha/index.js');
  });
  // support crna blank template -- https://github.com/expo/expo-cli/issues/2873
  // no package.json main, but has a file that expo managed would resolve as the entry.
  // This tests that a valid managed entry isn't resolved in bare.
  it(`resolves to null when the default file doesn't exist`, () => {
    expect(resolveBareEntryFile(projectRootBeta, null)).toEqual(null);
  });
});

describe(resolveBareEntryFile, () => {
  const projectRoot = '/alpha';
  const projectRootBeta = '/beta';

  beforeAll(() => {
    vol.fromJSON(
      {
        'index.js': '',
        'src/index.js': '',
      },
      projectRoot
    );
    vol.fromJSON(
      {
        'App.ios.js': '',
      },
      projectRootBeta
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`resolves null when the app entry is managed`, () => {
    expect(resolveBareEntryFile('/noop', 'node_modules/expo/AppEntry.js')).toEqual(null);
    expect(resolveBareEntryFile('/noop', 'expo/AppEntry.js')).toEqual(null);
  });
  it(`resolves to the provided main field`, () => {
    expect(resolveBareEntryFile(projectRoot, './src/index')).toEqual('/alpha/src/index.js');
    expect(resolveBareEntryFile(projectRoot, './index')).toEqual('/alpha/index.js');
    expect(resolveBareEntryFile(projectRootBeta, 'App')).toEqual('/beta/App.ios.js');
  });
  it(`resolves to the existing default main file when no field is defined`, () => {
    expect(resolveBareEntryFile(projectRoot, null)).toEqual('/alpha/index.js');
  });
  it(`resolves to null when the default file doesn't exist`, () => {
    expect(resolveBareEntryFile(projectRootBeta, null)).toEqual(null);
  });
});
