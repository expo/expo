import { AndroidConfig, WarningAggregator } from '@expo/config-plugins';

import {
  getNavigationBarStyle,
  setNavigationBarStyles,
  withNavigationBar,
} from '../withAndroidNavigationBar';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

describe('Android navigation bar', () => {
  it(`returns navigation bar style if provided`, () => {
    expect(getNavigationBarStyle({ androidNavigationBar: { barStyle: 'dark-content' } })).toMatch(
      'dark-content'
    );
  });

  it(`default navigation bar style to light-content if none provided`, () => {
    expect(getNavigationBarStyle({})).toMatch('light-content');
  });

  describe('e2e: write navigation color and style to files correctly', () => {
    it(`sets navigationBarColor transparent in styles.xml. sets windowLightNavigation bar true`, async () => {
      const stylesJSON = await setNavigationBarStyles(
        { androidNavigationBar: { barStyle: 'dark-content' } },
        { resources: {} }
      );

      const group = AndroidConfig.Styles.getStylesGroupAsObject(
        stylesJSON,
        AndroidConfig.Styles.getAppThemeGroup()
      );
      expect(group['android:navigationBarColor']).toBe('@android:color/transparent');
      expect(group['android:windowLightNavigationBar']).toBe('true');
    });

    it(`adds android warning androidNavigationBar.visible is provided`, async () => {
      // @ts-ignore: jest
      WarningAggregator.addWarningAndroid.mockImplementationOnce();
      withNavigationBar({ androidNavigationBar: { visible: 'leanback' } } as any);
      expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);
    });
  });
});
