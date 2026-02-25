import { ExpoConfig } from '@expo/config-types';

import { getStatusBarStyle, setStatusBarStyles } from '../StatusBar';
import { getAppThemeGroup, getStylesGroupAsObject } from '../Styles';

it(`returns statusbar style if provided`, () => {
  expect(getStatusBarStyle({ androidStatusBar: { barStyle: 'dark-content' } })).toMatch(
    'dark-content'
  );
});

it(`default statusbar style to light-content if none provided`, () => {
  expect(getStatusBarStyle({})).toMatch('light-content');
});

describe('e2e: write statusbar color and style to files correctly', () => {
  it(`sets the statusBarColor to '@android:color/transparent'`, async () => {
    const config: ExpoConfig = {
      name: 'foo',
      slug: 'bar',
      androidStatusBar: { barStyle: 'dark-content' },
    };
    const styles = setStatusBarStyles(config, { resources: {} });

    const group = getStylesGroupAsObject(styles, getAppThemeGroup())!;
    expect(group['android:statusBarColor']).toBe('@android:color/transparent');
  });
});
