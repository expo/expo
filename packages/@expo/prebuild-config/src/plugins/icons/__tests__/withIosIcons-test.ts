import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../__tests__/fixtures/react-native-project';
import { getIcons, ICON_CONTENTS, setIconsAsync } from '../withIosIcons';
import { getDirFromFS } from './utils/getDirFromFS';
const fsReal = jest.requireActual('fs') as typeof fs;

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

  it(`does not support empty string icons`, () => {
    expect(
      getIcons({
        icon: '',
        ios: {
          icon: '',
        },
      })
    ).toBe(null);

    expect(
      getIcons({
        icon: 'icon',
        ios: {
          icon: '',
        },
      })
    ).toMatch('icon');
  });
});

const totalPossibleIcons = ICON_CONTENTS.reduce((prev, curr) => {
  return prev.concat(curr.sizes.reduce((prev, curr) => prev.concat(curr.scales), []));
}, []).length;

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
        slug: 'ReactNativeProject',
        version: '1',
        name: 'ReactNativeProject',
        platforms: ['ios', 'android'],
        // must use full path for mock fs
        icon: '/app/assets/icon.png',
      },
      projectRoot
    );

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    const icons = Object.keys(after).filter(value =>
      value.startsWith('ios/ReactNativeProject/Images.xcassets/AppIcon.appiconset/App-Icon')
    );

    expect(icons.length).toBe(14);
    // Ensure we generate less icons than the possible combos,
    // this is because the Contents.json lets us reuse icons across platforms.
    expect(icons.length).toBeLessThan(totalPossibleIcons);

    // Test the Contents.json file
    const contents = JSON.parse(
      after['ios/ReactNativeProject/Images.xcassets/AppIcon.appiconset/Contents.json']
    );
    expect(contents.images).toMatchSnapshot();

    // Ensure all icons are assigned as expected.
    expect(contents.images.length).toBe(totalPossibleIcons);
  });
});
