import assert from 'assert';
import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin, withStringsXml } from 'expo/config-plugins';

export type Props = {
  userInterfaceStyle?: ExpoConfig['userInterfaceStyle'];
};

// strings.xml keys, this should not change.
const USER_INTERFACE_STYLE_KEY = 'expo_system_ui_user_interface_style';

export const withAndroidUserInterfaceStyle: ConfigPlugin<void> = (config) => {
  return withStringsXml(config, (config) => {
    config.modResults = setStrings(config.modResults, resolveProps(config));
    return config;
  });
};

export function resolveProps(config: Pick<ExpoConfig, 'userInterfaceStyle' | 'android'>): Props {
  const userInterfaceStyle = config.android?.userInterfaceStyle ?? config.userInterfaceStyle;

  assert(
    !userInterfaceStyle || ['automatic', 'light', 'dark'].includes(userInterfaceStyle),
    `expo-system-ui: Invalid userInterfaceStyle: "${userInterfaceStyle}"`
  );

  return { userInterfaceStyle };
}

export function setStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  { userInterfaceStyle }: Props
): AndroidConfig.Resources.ResourceXML {
  const pairs = [[USER_INTERFACE_STYLE_KEY, userInterfaceStyle]] as [string, any][];

  const stringItems: AndroidConfig.Resources.ResourceItemXML[] = [];
  for (const [key, value] of pairs) {
    if (value == null) {
      // Since we're using custom strings, we can remove them for convenience between prebuilds.
      strings = AndroidConfig.Strings.removeStringItem(key, strings);
    } else {
      stringItems.push(
        AndroidConfig.Resources.buildResourceItem({
          name: key,
          value: String(value),
          translatable: false,
        })
      );
    }
  }

  return AndroidConfig.Strings.setStringItem(stringItems, strings);
}
