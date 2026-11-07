import type { ExpoConfig } from 'expo/config';
import type { ExportedConfig } from 'expo/config-plugins';
import {
  AndroidConfig,
  compileModsAsync,
  evalModsAsync,
  withGradleProperties,
  withPodfileProperties,
} from 'expo/config-plugins';
import { promises as fs } from 'fs';
import { promises as nodeFs } from 'node:fs';
import os from 'os';
import path from 'path';

import type { PluginConfigType } from '../pluginConfig';
import { withBuildProperties } from '../withBuildProperties';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: { ...actual.promises, writeFile: jest.fn(actual.promises.writeFile) },
  };
});
jest.mock('node:fs', () => {
  const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    promises: { ...actual.promises, writeFile: jest.fn(actual.promises.writeFile) },
  };
});

type Platform = 'ios' | 'android';
type Properties = Record<string, string>;
type Contributions = [PluginConfigType, PluginConfigType];

const templateRoot = path.resolve(__dirname, '../../../../templates/expo-template-bare-minimum');
const writeMocks = [...new Set([jest.mocked(fs.writeFile), jest.mocked(nodeFs.writeFile)])];

function clearWrites() {
  for (const mock of writeMocks) mock.mockClear();
}

function writeCount() {
  return writeMocks.reduce((count, mock) => count + mock.mock.calls.length, 0);
}

function propertyFile(projectRoot: string, platform: Platform) {
  return path.join(
    projectRoot,
    platform,
    platform === 'ios' ? 'Podfile.properties.json' : 'gradle.properties'
  );
}

function hermesKey(platform: Platform) {
  return platform === 'ios' ? 'expo.useHermesV1' : 'hermesV1Enabled';
}

function parseProperties(platform: Platform, contents: string): Properties {
  if (platform === 'ios') return JSON.parse(contents);
  const properties: Properties = {};
  for (const item of AndroidConfig.Properties.parsePropertiesFile(contents)) {
    if (item.type === 'property') properties[item.key.trim()] = item.value;
  }
  return properties;
}

async function seedProperties(projectRoot: string, platform: Platform, stale: boolean) {
  const template = await fs.readFile(propertyFile(templateRoot, platform), 'utf8');
  expect(parseProperties(platform, template)[hermesKey(platform)]).toBeUndefined();
  await fs.mkdir(path.join(projectRoot, platform), { recursive: true });

  let contents: string;
  if (platform === 'ios') {
    const properties = {
      ...JSON.parse(template),
      'ios.useFrameworks': 'dynamic',
      'custom.existing': 'preserved',
      ...(stale ? { 'expo.useHermesV1': 'true' } : {}),
    };
    contents = JSON.stringify(properties, null, 2);
  } else {
    const lines = template.split('\n');
    if (stale) lines.splice(2, 0, 'hermesV1Enabled=true', 'hermesV1Enabled = true');
    lines.push('custom.existing=preserved', '');
    contents = lines.join('\n');
  }
  await fs.writeFile(propertyFile(projectRoot, platform), contents);
}

function configure(
  projectRoot: string,
  platform: Platform,
  contributions: Contributions,
  reverse: boolean
): ExportedConfig {
  const ordered: Contributions = reverse ? [contributions[1], contributions[0]] : contributions;
  const [first, second] = ordered;
  let config: ExpoConfig = {
    name: 'HermesTest',
    slug: 'hermes-test',
    _internal: { projectRoot },
  };
  config = withBuildProperties(config, first);
  config =
    platform === 'ios'
      ? withPodfileProperties(config, (config) => {
          config.modResults['custom.current'] = 'from-plugin';
          return { ...config };
        })
      : withGradleProperties(config, (config) => {
          config.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
            config.modResults,
            'custom.current',
            'from-plugin'
          );
          return { ...config };
        });
  config = withBuildProperties(config, second);

  const exported = config as ExportedConfig;
  exported.mods =
    platform === 'ios'
      ? { ios: { podfileProperties: exported.mods!.ios!.podfileProperties } }
      : { android: { gradleProperties: exported.mods!.android!.gradleProperties } };
  return exported;
}

function expectUnrelatedProperties(platform: Platform, properties: Properties) {
  expect(properties['custom.existing']).toBe('preserved');
  expect(properties['custom.current']).toBe('from-plugin');
  if (platform === 'ios') {
    expect(properties['ios.useFrameworks']).toBe('dynamic');
    expect(properties['apple.ccacheEnabled']).toBe('true');
  } else {
    for (const key of [
      'android.enableMinifyInReleaseBuilds',
      'expo.gif.enabled',
      'expo.webp.enabled',
    ]) {
      expect(properties[key]).toBe('true');
    }
  }
}

describe.each(['ios', 'android'] as const)('Hermes property lifecycle on %s', (platform) => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-hermes-properties-'));
    await seedProperties(projectRoot, platform, true);
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function checkLifecycle(
    contributions: Contributions,
    reverse: boolean,
    expectedValue: string
  ) {
    const file = propertyFile(projectRoot, platform);
    clearWrites();
    await compileModsAsync(configure(projectRoot, platform, contributions, reverse), {
      projectRoot,
      platforms: [platform],
    });
    expect(writeCount()).toBe(1);
    const firstContents = await fs.readFile(file, 'utf8');
    const first = parseProperties(platform, firstContents);
    expect(first[hermesKey(platform)]).toBe(expectedValue);
    expectUnrelatedProperties(platform, first);
    if (platform === 'android') {
      expect(
        AndroidConfig.Properties.parsePropertiesFile(firstContents).filter(
          (item) => item.type === 'property' && item.key.trim() === 'hermesV1Enabled'
        )
      ).toEqual([{ type: 'property', key: 'hermesV1Enabled', value: expectedValue }]);
    }

    const current: Contributions = [
      { buildReactNativeFromSource: true },
      { ios: { ccacheEnabled: true } },
    ];
    clearWrites();
    const introspected = await compileModsAsync(
      configure(projectRoot, platform, current, reverse),
      { projectRoot, platforms: [platform], introspect: true }
    );
    expect(writeCount()).toBe(0);
    expect(await fs.readFile(file, 'utf8')).toBe(firstContents);
    const introspectedProperties =
      introspected._internal!.modResults[platform][
        platform === 'ios' ? 'podfileProperties' : 'gradleProperties'
      ];
    if (platform === 'ios') {
      expect(Object.keys(introspectedProperties)).not.toContain('expo.useHermesV1');
    } else {
      expect(
        introspectedProperties.some(
          (item: AndroidConfig.Properties.PropertiesItem) =>
            item.type === 'property' && item.key.trim() === 'hermesV1Enabled'
        )
      ).toBe(false);
    }

    clearWrites();
    const evaluated = await compileModsAsync(configure(projectRoot, platform, current, reverse), {
      projectRoot,
      platforms: [platform],
    });
    expect(writeCount()).toBe(1);
    const removedContents = await fs.readFile(file, 'utf8');
    const removed = parseProperties(platform, removedContents);
    expect(Object.keys(removed)).not.toContain(hermesKey(platform));
    expectUnrelatedProperties(platform, removed);
    if (platform === 'android') {
      const unrelated = (contents: string) =>
        AndroidConfig.Properties.parsePropertiesFile(contents).filter(
          (item) => item.type !== 'property' || item.key.trim() !== 'hermesV1Enabled'
        );
      expect(unrelated(removedContents)).toEqual(unrelated(firstContents));
    }

    await fs.writeFile(file, firstContents);
    await evalModsAsync(evaluated, { projectRoot, platforms: [platform] });
    expect(parseProperties(platform, await fs.readFile(file, 'utf8'))).toEqual(removed);

    const cleanRoot = path.join(projectRoot, 'clean-reference');
    await seedProperties(cleanRoot, platform, false);
    await compileModsAsync(configure(cleanRoot, platform, current, reverse), {
      projectRoot: cleanRoot,
      platforms: [platform],
    });
    expect(
      parseProperties(platform, await fs.readFile(propertyFile(cleanRoot, platform), 'utf8'))
    ).toEqual(removed);
  }

  it.each([false, true])(
    'removes previous overrides and preserves interleaved contributions (reverse=%s)',
    async (reverse) => {
      await checkLifecycle(
        [
          { useHermesV1: false, buildReactNativeFromSource: true },
          { ios: { ccacheEnabled: true } },
        ],
        reverse,
        'false'
      );
    }
  );

  it.each([false, true])(
    'preserves platform overrides and explicit precedence across prebuilds (reverse=%s)',
    async (reverse) => {
      const platformOverride: PluginConfigType = {
        useHermesV1: true,
        buildReactNativeFromSource: true,
        ...(platform === 'ios'
          ? { ios: { useHermesV1: false } }
          : { android: { useHermesV1: false } }),
      };
      await checkLifecycle(
        [
          platformOverride,
          {
            useHermesV1: true,
            buildReactNativeFromSource: true,
            ios: { ccacheEnabled: true },
          },
        ],
        reverse,
        reverse ? 'true' : 'false'
      );
    }
  );
});
