import { ExpoConfig } from '@expo/config-types';

import { getColorsAsObject } from '../Colors';
import {
  getStatusBarColor,
  getStatusBarStyle,
  setStatusBarColors,
  setStatusBarStyles,
} from '../StatusBar';
import { getAppThemeLightNoActionBarGroup, getStylesGroupAsObject } from '../Styles';

it(`returns statusbar color if provided`, () => {
  expect(getStatusBarColor({ androidStatusBar: { backgroundColor: '#111111' } })).toMatch(
    '#111111'
  );
});

it(`returns statusbar style if provided`, () => {
  expect(getStatusBarStyle({ androidStatusBar: { barStyle: 'dark-content' } })).toMatch(
    'dark-content'
  );
});

it(`default statusbar style to light-content if none provided`, () => {
  expect(getStatusBarStyle({})).toMatch('light-content');
});

describe('e2e: write statusbar color and style to files correctly', () => {
  it(`sets the colorPrimaryDark item in styles.xml and adds color to colors.xml if 'androidStatusBar.backgroundColor' is given`, async () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      androidStatusBar: { backgroundColor: '#654321', barStyle: 'dark-content' },
    };
    const styles = setStatusBarStyles(config, { resources: {} });
    const colors = setStatusBarColors(config, { resources: {} });

    const group = getStylesGroupAsObject(styles, getAppThemeLightNoActionBarGroup());
    expect(group.colorPrimaryDark).toBe('@color/colorPrimaryDark');
    expect(group['android:windowLightStatusBar']).toBe('true');
    // Ensure the version guard is added
    expect(styles.resources.style[0].item[0].$['tools:targetApi']).toBe('23');
    expect(getColorsAsObject(colors).colorPrimaryDark).toBe('#654321');
  });

  it(`skips setting the status bar to translucent if no 'androidStatusBar.backgroundColor' is given`, async () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      androidStatusBar: {},
    };

    const styles = setStatusBarStyles(config, { resources: {} });
    const colors = setStatusBarColors(config, { resources: {} });

    const group = getStylesGroupAsObject(styles, getAppThemeLightNoActionBarGroup());

    expect(group).toStrictEqual(null);
    expect(colors.resources).toStrictEqual({});
  });
});
