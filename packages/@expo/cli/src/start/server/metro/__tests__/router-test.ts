import { vol } from 'memfs';

import { getAppRouterRelativeEntryPath } from '../router';

jest.mock('resolve-from');

afterEach(() => {
  vol.reset();
});

describe(getAppRouterRelativeEntryPath, () => {
  it(`returns undefined when the expo-router package cannot be resolved`, () => {
    vol.fromJSON(
      {
        'node_modules/expo/package.json': '{}',
      },
      '/'
    );

    expect(getAppRouterRelativeEntryPath('/')).toBe('../../app');
  });

  it(`returns the relative path when the file exists`, () => {
    vol.fromJSON(
      {
        'node_modules/expo-router/entry.js': 'export default () => {}',
      },
      '/'
    );
    expect(getAppRouterRelativeEntryPath('/')).toBe('../../app');
  });
  it(`returns the relative path when the file exists in a monorepo`, () => {
    vol.fromJSON(
      {
        'apps/demo/package.json': '{}',
        'package/expo-router/entry.js': 'export default () => {}',
      },
      '/'
    );
    expect(getAppRouterRelativeEntryPath('/apps/demo/')).toBe('../../app');
  });
});
