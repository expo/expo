import { vol } from 'memfs';

import { getAppRouterRelativeEntryPath, getApiRoutesForDirectory } from '../router';

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

describe(getApiRoutesForDirectory, () => {
  it('returns api routes by glob pattern', () => {
    vol.fromJSON(
      {
        'app/test.tsx': 'export default () => {}',
        'app/test+api.tsx': 'export default () => {}',
        'app/nested/route+api.tsx': 'export default () => {}',
        'app/.well-known/test+api.tsx': 'export default () => {}',
      },
      '/project'
    );
    expect(getApiRoutesForDirectory('/project/app').sort()).toEqual([
      '/project/app/.well-known/test+api.tsx',
      '/project/app/nested/route+api.tsx',
      '/project/app/test+api.tsx',
    ]);
  });
});
