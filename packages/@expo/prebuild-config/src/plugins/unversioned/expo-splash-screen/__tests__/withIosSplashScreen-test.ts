import { compileModsAsync } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import projectFixtures from '../../../__tests__/fixtures/react-native-project';
import { getDirFromFS } from '../../../__tests__/getDirFromFS';
import { withIosSplashScreen } from '../withIosSplashScreen';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

jest.mock('fs');

describe(withIosSplashScreen, () => {
  const iconPath = path.resolve(__dirname, '../../../__tests__/fixtures/icon.png');
  const icon = fsReal.readFileSync(iconPath, 'utf8');
  const projectRoot = '/app';
  beforeAll(async () => {
    vol.fromJSON(
      {
        ...projectFixtures,
        'assets/splash.png': icon as any,
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`supports color only mode`, async () => {
    let config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      _internal: { projectRoot },
    };

    // Apply the splash plugin
    config = withIosSplashScreen(config, {
      // must use full path for mock fs
      image: null,
      resizeMode: 'contain',
      backgroundColor: '#ff00ff',
      tabletImage: null,
      tabletBackgroundColor: null,
      dark: {
        image: null,
        backgroundColor: null,
        tabletImage: null,
        tabletBackgroundColor: null,
      },
      // userInterfaceStyle: 'automatic',
    });

    // compile all plugins and mods
    config = await compileModsAsync(config, {
      projectRoot,
      platforms: ['ios'],
      assertMissingModProviders: false,
    });

    // Test Results

    expect(config).toBeDefined();

    const infoPlist = await readPlistAsync('/app/ios/HelloWorld/Info.plist');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');

    const after = getDirFromFS(vol.toJSON(), path.join(projectRoot, 'ios'));

    // Image is not defined
    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/image.png']).not.toBeDefined();
  });

  it(`runs entire process`, async () => {
    let config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      _internal: { projectRoot },
    };

    // Apply the splash plugin
    config = withIosSplashScreen(config, {
      // must use full path for mock fs
      image: '/app/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ff00ff',
      tabletImage: '/app/assets/splash.png',
      tabletBackgroundColor: '#ff0000',
      dark: {
        image: '/app/assets/splash.png',
        backgroundColor: '#00ff00',
        tabletImage: '/app/assets/splash.png',
        tabletBackgroundColor: '#0000ff',
      },
      // userInterfaceStyle: 'automatic',
    });

    // compile all plugins and mods
    config = await compileModsAsync(config, { projectRoot, platforms: ['ios', 'android'] });

    // Test Results

    console.log({ config });

    expect(config).toBeDefined();

    const infoPlist = await readPlistAsync('/app/ios/HelloWorld/Info.plist');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');

    const after = getDirFromFS(vol.toJSON(), path.join(projectRoot, 'ios'));

    // Image is defined
    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/image.png']).toBeDefined();

    // Ensure images are created
    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/image@2x.png']).toMatch(/PNG/);
    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/image@3x.png']).toMatch(/PNG/);

    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/dark_image.png']).toMatch(/PNG/);

    // Image JSON
    expect(after['HelloWorld/Images.xcassets/SplashScreen.imageset/Contents.json']).toBeDefined();

    // Test the splash screen XML
    expect(after['HelloWorld/SplashScreen.storyboard']).toMatch(/contentMode="scaleAspectFit"/);
    expect(after['HelloWorld/SplashScreen.storyboard']).toMatch(/id="EXPO-SplashScreen"/);
  });
});

function readPlistAsync(plistPath: string) {
  const rawPlist = fs.readFileSync(plistPath, 'utf8');
  return plist.parse(rawPlist);
}
