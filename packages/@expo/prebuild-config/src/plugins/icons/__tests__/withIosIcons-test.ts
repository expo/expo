import { WarningAggregator } from '@expo/config-plugins';
import { ExpoConfig } from 'expo/config';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../__tests__/fixtures/react-native-project';
import { getDirFromFS } from '../../__tests__/getDirFromFS';
import { getIcons, setIconsAsync } from '../withIosIcons';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.setTimeout(30 * 1000);

jest.mock('@expo/config-plugins', () => ({
  ...jest.requireActual<object>('@expo/config-plugins'),
  WarningAggregator: {
    addWarningIOS: jest.fn(),
  },
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

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(1);
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'icon',
      'No icon is defined in the Expo config.'
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

describe('iOS .icon directory', () => {
  it('prefers ios-specific .icon over main icon', () => {
    expect(
      getIcons({
        icon: './assets/main.png',
        ios: {
          icon: './assets/ios.icon',
        },
      })
    ).toBe('./assets/ios.icon');
  });
});

describe('e2e: iOS liquid glass icons', () => {
  const projectRoot = '/app';

  beforeAll(async () => {
    vol.fromJSON(rnFixture, projectRoot);

    vol.mkdirpSync('/app/assets/MyApp.icon/Assets');
    vol.writeFileSync(
      '/app/assets/MyApp.icon/icon.json',
      JSON.stringify({
        version: 1,
        format: 'liquid-glass-icon',
      })
    );
    vol.writeFileSync('/app/assets/MyApp.icon/Assets/App-Icon-512x512@1x.png', 'icon-data');
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
