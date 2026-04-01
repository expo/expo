import { ExpoConfig } from 'expo/config';
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

type LegacyStatusBarStyle = NonNullable<NonNullable<ExpoConfig['androidStatusBar']>['barStyle']>;
type StatusBarStyle = 'light' | 'dark';

export type Props = {
  /** Determines whether the status bar starts hidden. */
  hidden?: boolean;
  /** Determines which style the status bar starts with. */
  style?: StatusBarStyle;
};

// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_status_bar_visibility';

const LEGACY_BAR_STYLE_MAP: Record<LegacyStatusBarStyle, StatusBarStyle> = {
  'dark-content': 'dark',
  'light-content': 'light',
};

const IOS_BAR_STYLE_MAP: Record<StatusBarStyle, string> = {
  dark: 'UIStatusBarStyleDarkContent',
  light: 'UIStatusBarStyleLightContent',
};

export const resolveAndroidLegacyProps = (config: Pick<ExpoConfig, 'androidStatusBar'>): Props => {
  const { androidStatusBar = {} } = config;
  const { barStyle, hidden } = androidStatusBar;

  return {
    style: barStyle != null ? LEGACY_BAR_STYLE_MAP[barStyle] : undefined,
    hidden,
  };
};

export const setAndroidStatusBarStyles = (
  styles: AndroidConfig.Resources.ResourceXML,
  { style }: Props
): AndroidConfig.Resources.ResourceXML =>
  AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style === 'dark',
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightStatusBar',
    value: 'true',
  });

const withAndroidStatusBarStyles: ConfigPlugin<Props | undefined> = (config, _props) => {
  const props = _props ?? resolveAndroidLegacyProps(config);

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

const withAndroidStatusBarStringsXml: ConfigPlugin<Props | undefined> = (config, _props) => {
  const props = _props ?? resolveAndroidLegacyProps(config);

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

const withIOSStatusBarInfoPlist: ConfigPlugin<Props | undefined> = (config, props) =>
  withInfoPlist(config, (config) => {
    config.modResults = setIOSStatusBarInfoPlist(config.modResults, props);
    return config;
  });

/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidStatusBar`).
 */
export const withStatusBarExpoGoManifest: ConfigPlugin<Props | undefined> = (config, _props) => {
  const props = _props ?? resolveAndroidLegacyProps(config);

  // TODO: Read this from Expo Go instead of `androidStatusBar`.
  // Elevate props to a static value on extra so Expo Go can read it.
  config.extra ??= {};
  config.extra[pkg.name] = props;

  if (config.androidStatusBar != null) {
    return config;
  }

  const barStyle = Object.entries(LEGACY_BAR_STYLE_MAP).find(
    ([, value]) => value === props.style
  )?.[0] as LegacyStatusBarStyle;

  // Remap the config plugin props so Expo Go knows how to apply them.
  config.androidStatusBar = { barStyle, hidden: props.hidden };

  return config;
};

const withStatusBar: ConfigPlugin<Props | undefined> = (config, props) => {
  config = withAndroidStatusBarStyles(config, props);
  config = withAndroidStatusBarStringsXml(config, props);
  config = withIOSStatusBarInfoPlist(config, props);
  return withStatusBarExpoGoManifest(config, props);
};

export default createRunOncePlugin(withStatusBar, pkg.name, pkg.version);
