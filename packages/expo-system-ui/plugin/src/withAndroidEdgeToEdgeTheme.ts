import { ConfigPlugin, withAndroidStyles } from 'expo/config-plugins';

export const withAndroidEdgeToEdgeTheme: ConfigPlugin = (config) => {
  return withAndroidStyles(config, async (config) => {
    const { experiments = {}, userInterfaceStyle = 'automatic' } = config;
    const { edgeToEdge = false } = experiments;

    config.modResults.resources.style = config.modResults.resources.style?.map(
      (style): typeof style => {
        if (style.$.name === 'AppTheme') {
          style.$.parent = edgeToEdge ? 'Theme.EdgeToEdge' : 'Theme.AppCompat.Light.NoActionBar';

          style.item = style.item.filter((item) => {
            if (item.$.name === 'windowLightSystemBars') {
              return false;
            }
            if (!edgeToEdge) {
              return true;
            }

            return (
              item.$.name !== 'android:statusBarColor' &&
              item.$.name !== 'android:navigationBarColor'
            );
          });

          if (edgeToEdge) {
            style.item.push({
              $: { name: 'windowLightSystemBars' },
              _: String(userInterfaceStyle === 'light'),
            });
          }
        }

        return style;
      }
    );

    return config;
  });
};
