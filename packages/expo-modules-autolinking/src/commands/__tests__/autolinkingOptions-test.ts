import { vol } from 'memfs';
import path from 'path';

import { createAutolinkingOptionsLoader } from '../autolinkingOptions';

const projectRoot = '/fake/project';

function makePackageJson(expo?: Record<string, unknown>): string {
  return JSON.stringify({
    name: 'fake-project',
    version: '0.0.0',
    ...(expo ? { expo } : {}),
  });
}

describe(createAutolinkingOptionsLoader, () => {
  afterEach(() => {
    vol.reset();
  });

  it('returns default options when no autolinking config exists', async () => {
    vol.fromNestedJSON({ 'package.json': makePackageJson() }, projectRoot);

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options).toMatchObject({
      platform: 'android',
      exclude: [],
      include: [],
      searchPaths: [],
    });
  });

  it('reads top-level exclude option', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            exclude: ['pkg-a', 'pkg-b'],
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.exclude).toEqual(['pkg-a', 'pkg-b']);
  });

  it('platform exclude overrides top-level exclude', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            exclude: ['pkg-a'],
            android: {
              exclude: ['pkg-b'],
            },
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.exclude).toEqual(['pkg-b']);
  });

  it('reads top-level include option', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            include: ['pkg-a'],
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.include).toEqual(['pkg-a']);
  });

  it('platform include merges with top-level include', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            include: ['pkg-a'],
            android: {
              include: ['pkg-b'],
            },
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.include).toEqual(['pkg-a', 'pkg-b']);
  });

  it('apple platform falls back to ios config', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            ios: {
              exclude: ['ios-only-exclude'],
              include: ['ios-only-include'],
            },
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('apple');

    expect(options.exclude).toEqual(['ios-only-exclude']);
    expect(options.include).toEqual(['ios-only-include']);
  });

  it('CLI exclude arguments are appended to config exclude', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            exclude: ['pkg-a'],
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({
      projectRoot,
      exclude: ['pkg-cli'],
    });
    const options = await loader.getPlatformOptions('android');

    expect(options.exclude).toEqual(['pkg-a', 'pkg-cli']);
  });

  it('resolves nativeModulesDir relative to app root', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            nativeModulesDir: './custom-modules',
          },
        }),
        'custom-modules': {},
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.nativeModulesDir).toBe(path.join(projectRoot, 'custom-modules'));
  });

  it('defaults nativeModulesDir to ./modules when it exists', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson(),
        modules: {},
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.nativeModulesDir).toBe(path.join(projectRoot, 'modules'));
  });

  it('reads buildFromSource option', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            android: {
              buildFromSource: ['expo-camera'],
            },
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('android');

    expect(options.buildFromSource).toEqual(['expo-camera']);
  });

  it('reads flags option', async () => {
    vol.fromNestedJSON(
      {
        'package.json': makePackageJson({
          autolinking: {
            apple: {
              flags: { inhibit_warnings: true },
            },
          },
        }),
      },
      projectRoot
    );

    const loader = createAutolinkingOptionsLoader({ projectRoot });
    const options = await loader.getPlatformOptions('apple');

    expect(options.flags).toEqual({ inhibit_warnings: true });
  });
});
