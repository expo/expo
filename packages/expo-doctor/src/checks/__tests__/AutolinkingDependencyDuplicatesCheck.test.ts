import { ExpoExportMissingError } from '../../utils/autolinkingResolutions';
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

describe('AutolinkingDependencyDuplicatesCheck', () => {
  it('outputs an error if the export is unavailable', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(
      {
        pkg: {},
        ...additionalProjectProps,
      },
      {
        resolutions: Promise.reject(new ExpoExportMissingError('Test message')),
      }
    );

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "Test message",
      ]
    `);
    expect(result.advice).toMatchInlineSnapshot(`
      [
        "Reinstall your dependencies and check that they're not in a corrupted state.",
      ]
    `);
  });

  it('returns failing result for duplicates dependencies exist', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(
      {
        pkg: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            react: '*',
          },
        },
        ...additionalProjectProps,
      },
      {
        resolutions: Promise.resolve(
          new Map([
            [
              'react',
              {
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
            ],
          ])
        ),
      }
    );

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

  it('returns failing result with advice for corrupted node_modules folders', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(
      {
        pkg: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            react: '*',
          },
        },
        ...additionalProjectProps,
      },
      {
        resolutions: Promise.resolve(
          new Map([
            [
              'react',
              {
                source: 0 as any,
                depth: 0,
                name: 'expo-constants',
                version: '18.0.2',
                path: '/tmp/root/node_modules/expo-constants',
                originPath: '/tmp/root/node_modules/expo-constants',
                duplicates: [
                  {
                    name: 'expo-constants',
                    version: '18.0.2',
                    path: '/tmp/root/node_modules/expo/node_modules/expo-constants',
                    originPath: '/tmp/root/node_modules/expo/node_modules/expo-constants',
                  },
                  {
                    name: 'expo-constants',
                    version: '18.0.2',
                    path: '/tmp/root/node_modules/expo-asset/node_modules/expo-constants',
                    originPath: '/tmp/root/node_modules/expo-asset/node_modules/expo-constants',
                  },
                ],
              },
            ],
          ])
        ),
      }
    );

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "Your project contains duplicate native module dependencies, which should be de-duplicated.
      Native builds may only contain one version of any given native module, and having multiple versions of a single Native module installed may lead to unexpected build errors.",
        "Found duplicates for expo-constants:
        ├─ expo-constants@18.0.2 (at: node_modules/expo-constants)
        ├─ expo-constants@18.0.2 (at: node_modules/expo/node_modules/expo-constants)
        └─ expo-constants@18.0.2 (at: node_modules/expo-asset/node_modules/expo-constants)",
      ]
    `);
    expect(result.advice).toMatchInlineSnapshot(`
      [
        "Your node_modules folder may be corrupted. Multiple copies of the same version exist for: expo-constants.
      - Try deleting your node_modules folders and reinstall your dependencies after.
      - If this error persists, delete your node_modules as well as your lockfile and reinstall.",
        "Resolve your dependency issues and deduplicate your dependencies. Learn more: https://expo.fyi/resolving-dependency-issues",
      ]
    `);
  });
  const isolatedResolution = (
    name: string,
    entries: { version: string; path: string; originPath?: string }[]
  ) =>
    Promise.resolve(
      new Map([
        [
          name,
          {
            source: 0 as any,
            depth: 0,
            name,
            version: entries[0].version,
            path: entries[0].path,
            originPath: entries[0].originPath ?? entries[0].path,
            duplicates: entries.slice(1).map((entry) => ({
              name,
              version: entry.version,
              path: entry.path,
              originPath: entry.originPath ?? entry.path,
            })),
          },
        ],
      ])
    );

  const projectProps = {
    pkg: { name: 'test-project', version: '1.0.0', dependencies: { 'expo-constants': '*' } },
    ...additionalProjectProps,
  };

  it('ignores same-version copies that all live in an isolated store', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(projectProps, {
      resolutions: isolatedResolution('expo-constants', [
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.bun/expo-constants@18.0.2+aaa/node_modules/expo-constants',
          originPath: '/tmp/root/node_modules/expo-constants',
        },
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.bun/expo@54.0.0+bbb/node_modules/expo-constants',
        },
      ]),
    });

    expect(result.isSuccessful).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.advice).toEqual([]);
  });

  it('ignores same-version copies in a pnpm store', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(projectProps, {
      resolutions: isolatedResolution('expo-constants', [
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.pnpm/expo-constants@18.0.2/node_modules/expo-constants',
          originPath: '/tmp/root/node_modules/expo-constants',
        },
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.pnpm/expo@54.0.0/node_modules/expo-constants',
        },
      ]),
    });

    expect(result.isSuccessful).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('still reports differing versions inside an isolated store', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(projectProps, {
      resolutions: isolatedResolution('expo-constants', [
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.bun/expo-constants@18.0.2+aaa/node_modules/expo-constants',
        },
        {
          version: '17.0.0',
          path: '/tmp/root/node_modules/.bun/expo-constants@17.0.0+bbb/node_modules/expo-constants',
        },
      ]),
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.issues.join('\n')).toContain('Found duplicates for expo-constants');
  });

  it('still reports a leftover copy resolving outside the store as corrupted', async () => {
    const check = new AutolinkingDependencyDuplicatesCheck();
    const result = await check.runAsync(projectProps, {
      resolutions: isolatedResolution('expo-constants', [
        { version: '18.0.2', path: '/tmp/root/node_modules/expo-constants' },
        {
          version: '18.0.2',
          path: '/tmp/root/node_modules/.bun/expo@54.0.0+bbb/node_modules/expo-constants',
        },
      ]),
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.advice.join('\n')).toContain('Your node_modules folder may be corrupted');
  });
});
