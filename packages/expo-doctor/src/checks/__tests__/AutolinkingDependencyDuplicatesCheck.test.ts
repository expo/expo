import { type ResolutionResult } from 'expo/internal/unstable-autolinking-exports';

import { importAutolinkingExportsFromProject } from '../../utils/autolinkingExportsLoader';
import { getVersionedNativeModuleNamesAsync } from '../../utils/versionedNativeModules';
import { AutolinkingDependencyDuplicatesCheck } from '../AutolinkingDependencyDuplicatesCheck';

const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
    sdkVersion: '54.0.0',
  },
  projectRoot: '/tmp/root',
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

jest.mock('../../utils/versionedNativeModules', () => ({
  getVersionedNativeModuleNamesAsync: jest.fn(() => ({})),
}));

jest.mock('../../utils/autolinkingExportsLoader', () => ({
  importAutolinkingExportsFromProject: jest.fn(() => ({})),
}));

describe('AutolinkingDependencyDuplicatesCheck', () => {
  it('returns successful result when no dependencies exist', async () => {
    const dependencies: ResolutionResult = {
      react: {
        source: 0 as any,
        depth: 0,
        name: 'react',
        version: '19.1.0',
        path: '/tmp/root/node_modules/react',
        originPath: '/tmp/root/node_modules/react',
        duplicates: [
          {
            name: 'react',
            version: '18.3.0',
            path: '/tmp/root/node_modules/duplicate/node_modules/react',
            originPath: '/tmp/root/node_modules/duplicate/node_modules/react',
          },
        ],
      },
    };

    jest.mocked(importAutolinkingExportsFromProject).mockReturnValue({
      ...jest.requireActual('expo/internal/unstable-autolinking-exports'),
      makeCachedDependenciesLinker: () => ({}) as any,
      scanDependencyResolutionsForPlatform: async () => dependencies,
    });

    jest.mocked(getVersionedNativeModuleNamesAsync).mockResolvedValue(['react']);

    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync({
      pkg: {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '*',
        },
      },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "Your project contains duplicate native module dependencies, which should be de-duplicated.
      Native builds may only contain one version of any given native module, and having multiple versions of a single Native module installed may lead to unexpected build errors.",
        "Found duplicates for react:
        ├─ react@19.1.0 (at: node_modules/react)
        └─ react@18.3.0 (at: node_modules/duplicate/node_modules/react)",
      ]
    `);
    expect(result.advice).toMatchInlineSnapshot(`
      [
        "Resolve your dependency issues and deduplicate your dependencies. Learn more: https://expo.fyi/resolving-dependency-issues",
      ]
    `);
  });
});
