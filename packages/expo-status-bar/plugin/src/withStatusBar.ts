import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  InfoPlist,
  withAndroidStyles,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

type StatusBarStyle = 'light' | 'dark';

export type Props = {
  /** Determines whether the status bar starts hidden. */
  hidden?: boolean;
  /** Determines which style the status bar starts with. */
  style?: StatusBarStyle;
};

const IOS_BAR_STYLE_MAP: Record<StatusBarStyle, string> = {
  dark: 'UIStatusBarStyleDarkContent',
  light: 'UIStatusBarStyleLightContent',
};

export function resolveProps(props: Props | undefined): Props | undefined {
  if (props == null) {
    return;
  }

  const { hidden, style } = props;

  const resolvedProps: Props = {
    ...(style != null && { style }),
    ...(hidden != null && { hidden }),
  };

  if (Object.keys(resolvedProps).length > 0) {
    return resolvedProps;
  }

  return;
}

export const setAndroidStatusBarStyles = (
  styles: AndroidConfig.Resources.ResourceXML,
  { hidden, style }: Props
): AndroidConfig.Resources.ResourceXML => {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: hidden != null,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'expoStatusBarHidden',
    value: String(hidden),
  });

  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style != null,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightStatusBar',
    value: String(style === 'dark'),
  });

  return styles;
};

const withAndroidStatusBarStyles: ConfigPlugin<Props> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setAndroidStatusBarStyles(config.modResults, props);
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

const withStatusBar: ConfigPlugin<Props | undefined> = (config, _props) => {
  const props = resolveProps(_props);

  if (props == null) {
    return config;
  }

  // Elevate props to a static value on extra so Expo Go can read it.
  config.extra ??= {};
  config.extra[pkg.name] = props;

  config = withAndroidStatusBarStyles(config, props);
  return withIOSStatusBarInfoPlist(config, props);
};

export default createRunOncePlugin(withStatusBar, pkg.name, pkg.version);
