import { ConfigPlugin, withAndroidStyles } from 'expo/config-plugins';

export const withAndroidEdgeToEdgeTheme: ConfigPlugin = (config) => {
  const ignoreList = new Set([
    'android:enforceNavigationBarContrast',
    'android:enforceStatusBarContrast',
    'android:fitsSystemWindows',
    'android:navigationBarColor',
    'android:statusBarColor',
    'android:windowDrawsSystemBarBackgrounds',
    'android:windowLayoutInDisplayCutoutMode',
    'android:windowLightNavigationBar',
    'android:windowLightStatusBar',
    'android:windowTranslucentNavigation',
    'android:windowTranslucentStatus',
  ]);

  return withAndroidStyles(config, (config) => {
    const { experiments = {} } = config;
    const { edgeToEdge = false } = experiments;

    config.modResults.resources.style = config.modResults.resources.style?.map(
      (style): typeof style => {
        if (style.$.name === 'AppTheme') {
          style.$.parent = edgeToEdge ? 'Theme.EdgeToEdge' : 'Theme.AppCompat.Light.NoActionBar';

          if (style.item != null && edgeToEdge) {
            style.item = style.item.filter((item) => !ignoreList.has(item.$.name));
          }
        }

        return style;
      }
    );

    return config;
  });
};
