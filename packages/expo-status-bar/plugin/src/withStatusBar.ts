import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  InfoPlist,
  withAndroidStyles,
  withInfoPlist,
  withStringsXml,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

type StatusBarStyle = 'light' | 'dark';

export type Props = {
  /** Determines whether the status bar starts hidden. */
  hidden?: boolean;
  /** Determines which style the status bar starts with. */
  style?: StatusBarStyle;
};

// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_status_bar_visibility';

const IOS_BAR_STYLE_MAP: Record<StatusBarStyle, string> = {
  dark: 'UIStatusBarStyleDarkContent',
  light: 'UIStatusBarStyleLightContent',
};

export const setAndroidStatusBarStyles = (
  styles: AndroidConfig.Resources.ResourceXML,
  { style }: Props
): AndroidConfig.Resources.ResourceXML => {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style != null,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightStatusBar',
    value: String(style === 'dark'),
  });

  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:statusBarColor',
    value: '@android:color/transparent',
  });

  return styles;
};

const withAndroidStatusBarStyles: ConfigPlugin<Props> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setAndroidStatusBarStyles(config.modResults, props);
    return config;
  });
};

export const setAndroidStrings = (
  strings: AndroidConfig.Resources.ResourceXML,
  { hidden }: Props
): AndroidConfig.Resources.ResourceXML => {
  if (hidden == null) {
    // Since we're using custom strings, we can remove them for convenience between prebuilds.
    return AndroidConfig.Strings.removeStringItem(VISIBILITY_KEY, strings);
  }

  const item = AndroidConfig.Resources.buildResourceItem({
    name: VISIBILITY_KEY,
    value: hidden ? 'hidden' : 'visible',
    translatable: false,
  });

  return AndroidConfig.Strings.setStringItem([item], strings);
};

const withAndroidStatusBarStringsXml: ConfigPlugin<Props> = (config, props) => {
  return withStringsXml(config, (config) => {
    config.modResults = setAndroidStrings(config.modResults, props);
    return config;
  });
};

export const setIOSStatusBarInfoPlist = (
  plist: InfoPlist,
  { hidden, style }: Props = {}
): InfoPlist => {
  if (hidden != null) {
    plist.UIStatusBarHidden = hidden;
  }
  if (style != null) {
    plist.UIStatusBarStyle = IOS_BAR_STYLE_MAP[style];
  }
  return plist;
};

const withIOSStatusBarInfoPlist: ConfigPlugin<Props> = (config, props) =>
  withInfoPlist(config, (config) => {
    config.modResults = setIOSStatusBarInfoPlist(config.modResults, props);
    return config;
  });

const withStatusBar: ConfigPlugin<Props | void> = (config, props) => {
  if (props == null) {
    return config;
  }

  // Elevate props to a static value on extra so Expo Go can read it.
  config.extra ??= {};
  config.extra[pkg.name] = props;

  config = withAndroidStatusBarStyles(config, props);
  config = withAndroidStatusBarStringsXml(config, props);
  return withIOSStatusBarInfoPlist(config, props);
};

export default createRunOncePlugin(withStatusBar, pkg.name, pkg.version);
