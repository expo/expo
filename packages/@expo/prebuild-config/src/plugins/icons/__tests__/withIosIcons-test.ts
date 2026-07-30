import { WarningAggregator } from '@expo/config-plugins';
import type { ExportedConfigWithProps, XcodeProject } from '@expo/config-plugins';
import type { ExpoConfig, IOSIcons } from '@expo/config-types';
import type * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';
import xcode from 'xcode';

import rnFixture from '../../__tests__/fixtures/react-native-project';
import { getDirFromFS } from '../../__tests__/getDirFromFS';
import { getIcons, setIconsAsync, withIosIcons } from '../withIosIcons';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.setTimeout(30 * 1000);

jest.mock('@expo/config-plugins', () => ({
  ...jest.requireActual<object>('@expo/config-plugins'),
  WarningAggregator: {
    addWarningIOS: jest.fn(),
  },
  // Stubbed out for the whole file: the dangerous mod is skipped entirely (so `setIconsAsync` only
  // runs where a test calls it directly), and the Xcode mod runs its action synchronously.
  withDangerousMod: jest.fn((config: any) => config),
  withXcodeProject: jest.fn((config: any, action: any) => action(config)),
}));

jest.mock('fs');

describe('iOS Icons', () => {
  it(`returns null if no icon values provided`, () => {
    expect(getIcons({})).toBeNull();
  });

  it(`uses more specific icon`, () => {
    expect(
      getIcons({
        icon: 'icon',
      })
    ).toMatch('icon');
    expect(
      getIcons({
        icon: 'icon',
        ios: {
          icon: 'iosIcon',
        },
      })
    ).toMatch('iosIcon');
  });

  it(`uses more specific icon - appearance aware`, () => {
    expect(
      getIcons({
        icon: 'icon',
      })
    ).toMatch('icon');
    expect(
      getIcons({
        icon: 'icon',
        ios: {
          icon: {
            dark: 'iosIcon',
          },
        },
      })
    ).toMatchObject({ dark: 'iosIcon' });
  });

  it(`does not support empty string icons`, () => {
    expect(
      getIcons({
        icon: '',
        ios: {
          // `any` is not a valid IOSIcons key; this asserts unknown/empty keys are ignored.
          icon: {
            any: '',
          } as IOSIcons,
        },
      })
    ).toBe(null);

    expect(
      getIcons({
        icon: 'icon',
        ios: {
          // `any` is not a valid IOSIcons key; this asserts unknown/empty keys are ignored.
          icon: {
            any: '',
          } as IOSIcons,
        },
      })
    ).toMatch('icon');
  });

  it(`warns when .icon files are used when an object is provided`, () => {
    (WarningAggregator.addWarningIOS as jest.Mock).mockClear();

    getIcons({
      ios: {
        icon: {
          light: 'assets/MyApp.icon',
          dark: 'assets/MyAppDark.icon',
        },
      },
    });

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(2);
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'Liquid glass icons (.icon) should be provided as a string to the "ios.icon" property, not as an object. Found: "assets/MyApp.icon"'
    );
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'Liquid glass icons (.icon) should be provided as a string to the "ios.icon" property, not as an object. Found: "assets/MyAppDark.icon"'
    );
  });

  it(`warns when .icon files are used in root icon property`, () => {
    (WarningAggregator.addWarningIOS as jest.Mock).mockClear();

    getIcons({
      icon: 'assets/MyApp.icon',
    });

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(1);
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'Liquid glass icons (.icon) should be provided via the "ios.icon" property, not the root "icon" property. Found: "assets/MyApp.icon"'
    );
  });
});

describe(withIosIcons, () => {
  const projectRoot = '/app';
  const projectName = 'HelloWorld';
  const pbxprojPath = `ios/${projectName}.xcodeproj/project.pbxproj`;
  const generatedAppIconName = 'AppIcon';
  // Seeded into the fixture, which already ships `generatedAppIconName`, so that "left alone" is
  // distinguishable from "reset to the generated appiconset".
  const staleAppIconName = 'oldIcon';
  const liquidGlassAppIconName = 'MyApp';

  // Expected results of `getAppIconNames`. The fixture's app target has a Debug and a Release
  // configuration, and the plugin writes to both.
  const generatedAppIconNames = {
    Debug: generatedAppIconName,
    Release: generatedAppIconName,
  };
  const staleAppIconNames = { Debug: staleAppIconName, Release: staleAppIconName };
  const liquidGlassAppIconNames = {
    Debug: liquidGlassAppIconName,
    Release: liquidGlassAppIconName,
  };

  afterEach(() => {
    vol.reset();
  });

  function parseProjectWithStaleAppIconName(): XcodeProject {
    const pbxproj = rnFixture[pbxprojPath].replace(
      new RegExp(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`, 'g'),
      `ASSETCATALOG_COMPILER_APPICON_NAME = ${staleAppIconName};`
    );

    vol.fromJSON({ [pbxprojPath]: pbxproj }, projectRoot);

    const project = xcode.project(path.join(projectRoot, pbxprojPath));
    project.parseSync();
    return project;
  }

  function runPlugin(
    project: XcodeProject,
    config: Pick<ExpoConfig, 'icon' | 'ios'>,
    modRequest: { projectName?: string } = { projectName }
  ) {
    withIosIcons({
      slug: projectName,
      version: '1',
      name: projectName,
      platforms: ['ios'],
      ...config,
      modResults: project,
      modRequest,
    } as ExportedConfigWithProps<XcodeProject>);
  }

  // Keyed by build configuration name, so asserting on the whole map catches a partial update.
  function getAppIconNames(project: XcodeProject): Record<string, string> {
    const configurations = Object.entries(project.pbxXCBuildConfigurationSection()).filter(
      ([key]) => !key.endsWith('_comment')
    );

    return Object.fromEntries(
      configurations
        .map(([, configuration]) => [
          (configuration as any).name,
          (configuration as any).buildSettings?.ASSETCATALOG_COMPILER_APPICON_NAME,
        ])
        .filter(([, appIconName]) => appIconName !== undefined)
    );
  }

  it.each<[string, Pick<ExpoConfig, 'icon' | 'ios'>]>([
    ['a PNG icon in `ios.icon`', { ios: { icon: './assets/icon.png' } }],
    [
      'appearance-aware icons in `ios.icon`',
      { ios: { icon: { light: './assets/light.png', dark: './assets/dark.png' } } },
    ],
    ['a PNG icon in the root `icon`', { icon: './assets/icon.png' }],
  ])('resets the app icon name to the generated appiconset for %s', (_, config) => {
    const project = parseProjectWithStaleAppIconName();

    runPlugin(project, config);

    expect(getAppIconNames(project)).toEqual(generatedAppIconNames);
  });

  it('points the app icon name at a `.icon` package and adds it to the project', () => {
    const project = parseProjectWithStaleAppIconName();

    runPlugin(project, { ios: { icon: `assets/${liquidGlassAppIconName}.icon` } });

    const output = project.writeSync();
    expect(getAppIconNames(project)).toEqual(liquidGlassAppIconNames);
    expect(output).toContain(`/* ${liquidGlassAppIconName}.icon in Resources */`);
    expect(output).toContain(`path = "${projectName}/${liquidGlassAppIconName}.icon"`);
  });

  it('removes stale `.icon` resource references when switching back to a PNG icon', () => {
    const project = parseProjectWithStaleAppIconName();

    // A prebuild that configured a liquid glass icon...
    runPlugin(project, { ios: { icon: `assets/${liquidGlassAppIconName}.icon` } });
    expect(getAppIconNames(project)).toEqual(liquidGlassAppIconNames);
    expect(project.writeSync()).toContain(`${liquidGlassAppIconName}.icon`);

    // ...followed by one where the user switched back to a PNG icon.
    runPlugin(project, { ios: { icon: './assets/icon.png' } });

    expect(getAppIconNames(project)).toEqual(generatedAppIconNames);
    // `setIconsAsync` no longer copies the `.icon` package into the project, so leaving its build
    // file and file references behind would point the build at a file that isn't there.
    expect(project.writeSync()).not.toContain(`${liquidGlassAppIconName}.icon`);
  });

  it('leaves the app icon name alone when no icon is configured', () => {
    const project = parseProjectWithStaleAppIconName();

    runPlugin(project, {});

    expect(getAppIconNames(project)).toEqual(staleAppIconNames);
  });

  it('leaves the app icon name alone when the project name is unknown', () => {
    const project = parseProjectWithStaleAppIconName();

    runPlugin(
      project,
      { ios: { icon: `assets/${liquidGlassAppIconName}.icon` } },
      { projectName: undefined }
    );

    expect(getAppIconNames(project)).toEqual(staleAppIconNames);
  });
});

describe('e2e: iOS icons', () => {
  const iconPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');

  const projectRoot = '/app';
  beforeAll(async () => {
    const icon = fsReal.readFileSync(iconPath);

    vol.fromJSON(rnFixture, projectRoot);

    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/icon.png', icon);
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the image files expected', async () => {
    await setIconsAsync(
      {
        slug: 'HelloWorld',
        version: '1',
        name: 'HelloWorld',
        platforms: ['ios', 'android'],
        // must use full path for mock fs
        icon: '/app/assets/icon.png',
      },
      projectRoot
    );

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    const icons = Object.keys(after).filter((value) =>
      value.startsWith('ios/HelloWorld/Images.xcassets/AppIcon.appiconset/App-Icon')
    );

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(0);

    expect(icons.length).toBe(1);

    // Test the Contents.json file
    const contents = JSON.parse(
      after['ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json']!
    );
    expect(contents.images).toMatchSnapshot();

    // Ensure all icons are assigned as expected.
    expect(contents.images.length).toBe(1);
  });
});

describe('e2e: iOS liquid glass icons', () => {
  const iconPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');
  const projectRoot = '/app';
  const generatedIconPath =
    'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png';
  const generatedIconContentsPath =
    'ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json';

  beforeEach(() => {
    const icon = fsReal.readFileSync(iconPath);

    vol.fromJSON(
      {
        ...rnFixture,
        '/app/assets/MyApp.icon/icon.json': JSON.stringify({
          version: 1,
          format: 'liquid-glass-icon',
        }),
        '/app/assets/MyApp.icon/Assets/App-Icon-512x512@1x.png': 'icon-data',
      },
      projectRoot
    );

    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/icon.png', icon);
  });

  afterEach(() => {
    vol.reset();
  });

  async function generatePngAppIconAsync() {
    await setIconsAsync(
      {
        slug: 'HelloWorld',
        version: '1',
        name: 'HelloWorld',
        platforms: ['ios', 'android'],
        icon: '/app/assets/icon.png',
      },
      projectRoot
    );

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(after[generatedIconPath]).toBeDefined();
    expect(after[generatedIconContentsPath]).toBeDefined();
  }

  function setLiquidGlassIconAsync(icon: string) {
    return setIconsAsync(
      {
        slug: 'HelloWorld',
        version: '1',
        name: 'HelloWorld',
        platforms: ['ios', 'android'],
        ios: { icon },
      },
      projectRoot
    );
  }

  it('replaces the generated PNG app icon with the .icon package', async () => {
    await generatePngAppIconAsync();

    await setLiquidGlassIconAsync('assets/MyApp.icon');

    // The appiconset is what the PNG path generates, so it has to go once a `.icon` package owns
    // the app icon — otherwise the project carries two competing icon sources.
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(after[generatedIconPath]).toBeUndefined();
    expect(after[generatedIconContentsPath]).toBeUndefined();
    expect(after['ios/HelloWorld/MyApp.icon/icon.json']).toBe(
      JSON.stringify({
        version: 1,
        format: 'liquid-glass-icon',
      })
    );
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(0);
  });

  it('keeps the generated PNG app icon when the .icon package is missing', async () => {
    await generatePngAppIconAsync();

    await setLiquidGlassIconAsync('assets/DoesNotExist.icon');

    // Nothing was copied in, so removing the generated icons would leave no app icon at all.
    const after = getDirFromFS(vol.toJSON(), projectRoot);
    expect(after[generatedIconPath]).toBeDefined();
    expect(after[generatedIconContentsPath]).toBeDefined();
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'Liquid glass icon file not found at path: assets/DoesNotExist.icon'
    );
  });
});

describe('e2e: iOS icons with fallback image', () => {
  const projectRoot = '/app';
  beforeAll(async () => {
    vol.fromJSON(rnFixture, projectRoot);
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the image files expected', async () => {
    await setIconsAsync(
      {
        slug: 'HelloWorld',
        version: '1',
        name: 'HelloWorld',
        platforms: ['ios', 'android'],
        // No icon should be set
      },
      projectRoot
    );

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    const icons = Object.keys(after).filter((value) =>
      value.startsWith('ios/HelloWorld/Images.xcassets/AppIcon.appiconset/App-Icon')
    );

    expect(icons.length).toBe(1);

    // Test the Contents.json file
    const contents = JSON.parse(
      after['ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json']!
    );
    expect(contents.images).toMatchSnapshot();

    // Ensure all icons are assigned as expected.
    expect(contents.images.length).toBe(1);
  });
});
