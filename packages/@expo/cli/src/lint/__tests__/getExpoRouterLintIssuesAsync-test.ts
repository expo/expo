import { getConfig } from '@expo/config';
import { vol } from 'memfs';
import resolveFrom from 'resolve-from';

import { getExpoRouterLintIssuesAsync } from '../expoRouterRoutes';

jest.mock('@expo/config');
jest.mock('resolve-from', () => ({
  __esModule: true,
  default: { silent: jest.fn() },
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockResolveSilent = resolveFrom.silent as jest.MockedFunction<typeof resolveFrom.silent>;

const projectRoot = '/project';

function fromFiles(files: string[]) {
  vol.fromJSON(Object.fromEntries(files.map((file) => [file, ''])), projectRoot);
}

describe(getExpoRouterLintIssuesAsync, () => {
  beforeEach(() => {
    vol.reset();
    mockGetConfig.mockReturnValue({ exp: { extra: {} } } as any);
    mockResolveSilent.mockReturnValue('/project/node_modules/expo-router/package.json');
  });

  it('should detect a fallback-less platform route under the default app directory', async () => {
    fromFiles(['app/_layout.tsx', 'app/index.tsx', 'app/profile.ios.tsx']);

    expect(await getExpoRouterLintIssuesAsync(projectRoot)).toEqual({
      routerRoot: 'app',
      issues: [
        { type: 'missing-fallback', file: 'profile.ios.tsx', platform: 'ios', base: 'profile' },
      ],
    });
  });

  it('should resolve the src/app router root and accept valid platform routes', async () => {
    fromFiles(['src/app/about.tsx', 'src/app/about.web.tsx']);

    expect(await getExpoRouterLintIssuesAsync(projectRoot)).toEqual({
      routerRoot: 'src/app',
      issues: [],
    });
  });

  it('should return null when expo-router is not installed', async () => {
    mockResolveSilent.mockReturnValue(undefined);
    fromFiles(['app/profile.ios.tsx']);

    expect(await getExpoRouterLintIssuesAsync(projectRoot)).toBeNull();
  });
});
