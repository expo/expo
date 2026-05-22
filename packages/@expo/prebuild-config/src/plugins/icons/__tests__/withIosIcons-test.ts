import { WarningAggregator } from '@expo/config-plugins';
import type { ExpoConfig } from '@expo/config-types';
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
          icon: {
            any: '',
          },
        },
      })
    ).toBe(null);

    expect(
      getIcons({
        icon: 'icon',
        ios: {
          icon: {
            any: '',
          },
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
  const pbxprojPath = 'ios/HelloWorld.xcodeproj/project.pbxproj';
  const generatedAppIconName = path.basename('Images.xcassets/AppIcon.appiconset', '.appiconset');

  afterEach(() => {
    vol.reset();
  });

  it('resets the Xcode app icon name to the generated appiconset when using a PNG icon', () => {
    const projectWithLiquidGlassIconName = rnFixture[pbxprojPath].replace(
      new RegExp(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`, 'g'),
      'ASSETCATALOG_COMPILER_APPICON_NAME = oldIcon;'
    );

    vol.fromJSON({ [pbxprojPath]: projectWithLiquidGlassIconName }, projectRoot);

    const project = xcode.project(path.join(projectRoot, pbxprojPath));
    project.parseSync();

    withIosIcons({
      slug: 'HelloWorld',
      version: '1',
      name: 'HelloWorld',
      platforms: ['ios'],
      ios: {
        icon: '/app/assets/icon.png',
      },
      modResults: project,
      modRequest: {
        projectName: 'HelloWorld',
      },
    } as any);

    const output = project.writeSync();
    expect(output).toContain(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`);
    expect(output).not.toContain('ASSETCATALOG_COMPILER_APPICON_NAME = oldIcon;');
  });

  it('removes stale .icon resource references when switching back to a PNG icon', () => {
    vol.fromJSON({ [pbxprojPath]: rnFixture[pbxprojPath] }, projectRoot);

    const project = xcode.project(path.join(projectRoot, pbxprojPath));
    project.parseSync();

    withIosIcons({
      slug: 'HelloWorld',
      version: '1',
      name: 'HelloWorld',
      platforms: ['ios'],
      ios: {
        icon: 'assets/AppIcon.icon',
      },
      modResults: project,
      modRequest: {
        projectName: 'HelloWorld',
      },
    } as any);

    expect(project.writeSync()).toContain('AppIcon.icon');

    withIosIcons({
      slug: 'HelloWorld',
      version: '1',
      name: 'HelloWorld',
      platforms: ['ios'],
      ios: {
        icon: '/app/assets/icon.png',
      },
      modResults: project,
      modRequest: {
        projectName: 'HelloWorld',
      },
    } as any);

    const output = project.writeSync();
    expect(output).toContain(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`);
    expect(output).not.toContain('AppIcon.icon');
  });

  it('does not reset the Xcode app icon name when no icon is configured', () => {
    const projectWithCustomIconName = rnFixture[pbxprojPath].replace(
      new RegExp(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`, 'g'),
      'ASSETCATALOG_COMPILER_APPICON_NAME = oldIcon;'
    );

    vol.fromJSON({ [pbxprojPath]: projectWithCustomIconName }, projectRoot);

    const project = xcode.project(path.join(projectRoot, pbxprojPath));
    project.parseSync();

    withIosIcons({
      slug: 'HelloWorld',
      version: '1',
      name: 'HelloWorld',
      platforms: ['ios'],
      modResults: project,
      modRequest: {
        projectName: 'HelloWorld',
      },
    } as any);

    const output = project.writeSync();
    expect(output).toContain('ASSETCATALOG_COMPILER_APPICON_NAME = oldIcon;');
    expect(output).not.toContain(`ASSETCATALOG_COMPILER_APPICON_NAME = ${generatedAppIconName};`);
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
      after['ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json']
    );
    expect(contents.images).toMatchSnapshot();

    // Ensure all icons are assigned as expected.
    expect(contents.images.length).toBe(1);
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
      after['ios/HelloWorld/Images.xcassets/AppIcon.appiconset/Contents.json']
    );
    expect(contents.images).toMatchSnapshot();

    // Ensure all icons are assigned as expected.
    expect(contents.images.length).toBe(1);
  });
});

describe('e2e: iOS liquid glass icons', () => {
  const projectRoot = '/app';

  beforeAll(async () => {
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
  });

  afterAll(() => {
    vol.reset();
  });

  it('detects .icon directories correctly', () => {
    const config = {
      ios: { icon: 'assets/MyApp.icon' },
    };

    const icon = getIcons(config);
    expect(icon).toBe('assets/MyApp.icon');

    if (typeof icon === 'string') {
      expect(path.extname(icon)).toBe('.icon');
    }
  });

  it('processes .icon directories without warnings', async () => {
    const config: ExpoConfig = {
      slug: 'HelloWorld',
      version: '1',
      name: 'HelloWorld',
      platforms: ['ios', 'android'],
      ios: {
        icon: 'assets/MyApp.icon',
      },
    };

    const icon = getIcons(config);
    expect(icon).toBe('assets/MyApp.icon');
    if (typeof icon === 'string') {
      expect(path.extname(icon)).toBe('.icon');
    }

    (WarningAggregator.addWarningIOS as jest.Mock).mockClear();

    await setIconsAsync(config, projectRoot);

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(0);
  });

  it('warns when .icon file does not exist', async () => {
    (WarningAggregator.addWarningIOS as jest.Mock).mockClear();

    await setIconsAsync(
      {
        slug: 'HelloWorld',
        version: '1',
        name: 'HelloWorld',
        platforms: ['ios', 'android'],
        ios: {
          icon: 'assets/DoesNotExist.icon',
        },
      },
      projectRoot
    );

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'Liquid glass icon file not found at path: assets/DoesNotExist.icon'
    );
  });
});
