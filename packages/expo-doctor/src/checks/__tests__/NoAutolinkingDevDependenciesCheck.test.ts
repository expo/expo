import { ExpoExportMissingError } from '../../utils/autolinkingResolutions';
import { NoAutolinkingDevDependenciesCheck } from '../NoAutolinkingDevDependenciesCheck';

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
    const check = new NoAutolinkingDevDependenciesCheck();
    const result = await check.runAsync(
      {
        pkg: {},
        ...additionalProjectProps,
      },
      {
        devDependenciesResolutions: Promise.reject(new ExpoExportMissingError('Test message')),
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

  it('returns failing result for native modules in devDependencies', async () => {
    const check = new NoAutolinkingDevDependenciesCheck();
    const result = await check.runAsync(
      {
        pkg: {
          name: 'test-project',
          version: '1.0.0',
          devDependencies: {
            'react-native-reanimated': '*',
          },
        },
        ...additionalProjectProps,
      },
      {
        devDependenciesResolutions: Promise.resolve(
          new Map([
            [
              'react-native-reanimated',
              {
                source: 0 as any,
                depth: 0,
                name: 'react-native-reanimated',
                version: '0.0.0',
                path: '/tmp/root/node_modules/react-native-reanimated',
                originPath: '/tmp/root/node_modules/react-native-reanimated',
                duplicates: [],
              },
            ],
          ])
        ),
      }
    );

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues).toMatchInlineSnapshot(`
      [
        "The package "react-native-reanimated" is a native module and shouldn't be in "devDependencies".",
      ]
    `);
    expect(result.advice).toMatchInlineSnapshot(`
      [
        "Native modules are only autolinked from regular dependencies and not devDependencies.
      Move any native modules from your package.json's "devDependencies" to regular "dependencies" and reinstall.",
      ]
    `);
  });

  it('returns succeeding result for native modules in dependencies', async () => {
    const check = new NoAutolinkingDevDependenciesCheck();
    const result = await check.runAsync(
      {
        pkg: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'react-native-reanimated': '*',
          },
        },
        ...additionalProjectProps,
      },
      {
        devDependenciesResolutions: Promise.resolve(
          new Map([
            [
              'react-native-reanimated',
              {
                source: 0 as any,
                depth: 0,
                name: 'react-native-reanimated',
                version: '0.0.0',
                path: '/tmp/root/node_modules/react-native-reanimated',
                originPath: '/tmp/root/node_modules/react-native-reanimated',
                duplicates: [],
              },
            ],
          ])
        ),
      }
    );

    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns succeeding result for native modules in both devDependencies and dependencies', async () => {
    const check = new NoAutolinkingDevDependenciesCheck();
    const result = await check.runAsync(
      {
        pkg: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'react-native-reanimated': '*',
          },
          devDependencies: {
            'react-native-reanimated': '*',
          },
        },
        ...additionalProjectProps,
      },
      {
        devDependenciesResolutions: Promise.resolve(
          new Map([
            [
              'react-native-reanimated',
              {
                source: 0 as any,
                depth: 0,
                name: 'react-native-reanimated',
                version: '0.0.0',
                path: '/tmp/root/node_modules/react-native-reanimated',
                originPath: '/tmp/root/node_modules/react-native-reanimated',
                duplicates: [],
              },
            ],
          ])
        ),
      }
    );

    expect(result.isSuccessful).toBeTruthy();
  });
});
