import {
  AndroidConfig,
  ConfigPlugin,
  ExportedConfigWithProps,
  createRunOncePlugin,
  WarningAggregator,
  withAndroidStyles,
  withStringsXml,
} from 'expo/config-plugins';

import { NavigationBarVisibility } from '../..';

const pkg = require('../../package.json');

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;

type NavigationBarStyle = 'light' | 'dark';

export type Props = {
  /**
   * Whether the OS should keep the navigation bar translucent for contrast.
   * @default true
   * @platform android
   */
  enforceContrast?: boolean;
  /**
   * Whether the navigation bar starts hidden.
   * @platform android
   */
  hidden?: boolean;
  /**
   * Which style the navigation bar starts with. Accepts `light` and `dark`.
   * @platform android
   */
  style?: NavigationBarStyle;

  /** @deprecated */
  barStyle?: NavigationBarStyle | null;
  /** @deprecated */
  visibility?: NavigationBarVisibility;
};

// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';

export function resolveProps(props: Props | undefined): Props | undefined {
  if (props == null) {
    return;
  }

  if ('barStyle' in props) {
    WarningAggregator.addWarningAndroid(
      'expo-navigation-bar barStyle',
      'Use `style` instead. This will be removed in a future release.'
    );
  }
  if ('visibility' in props) {
    WarningAggregator.addWarningAndroid(
      'expo-navigation-bar visibility',
      'Use `hidden` instead. This will be removed in a future release.'
    );
  }

  const { enforceContrast } = props;
  const style = props.style ?? props.barStyle ?? undefined;

  const hidden =
    props.hidden ?? (props.visibility == null ? undefined : props.visibility === 'hidden');

  const resolvedProps: Props = {
    ...(enforceContrast != null && { enforceContrast }),
    ...(style != null && { style }),
    ...(hidden != null && { hidden }),
  };

  if (Object.keys(resolvedProps).length > 0) {
    return resolvedProps;
  }
}

const withNavigationBar: ConfigPlugin<Props | undefined> = (config, _props) => {
  const props = resolveProps(_props);

  if (props == null) {
    return config;
  }

  // Elevate props to a static value on extra so Expo Go can read it.
  config.extra ??= {};
  config.extra[pkg.name] = props;

  // Use built-in styles instead of Expo custom properties, this makes the project hopefully a bit more predictable for bare users.
  config = withNavigationBarStyles(config, props);

  return withStringsXml(config, (config) => {
    config.modResults = setStrings(config.modResults, props);
    return config;
  });
};

export function setStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  { hidden }: Props
): AndroidConfig.Resources.ResourceXML {
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
}

const withNavigationBarStyles: ConfigPlugin<Props> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(props, config.modResults);
    return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
  });
};

export function setNavigationBarStyles(
  { style }: Props,
  styles: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style != null,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightNavigationBar',
    value: String(style === 'dark'),
  });

  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: true,
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:navigationBarColor',
    value: '@android:color/transparent',
  });

  return styles;
}

export function applyEnforceNavigationBarContrast(
  config: ResourceXMLConfig,
  enforceNavigationBarContrast: boolean
): ResourceXMLConfig {
  const enforceNavigationBarContrastItem = {
    _: enforceNavigationBarContrast ? 'true' : 'false',
    $: {
      name: 'android:enforceNavigationBarContrast',
      'tools:targetApi': '29',
    },
  };
  const { style = [] } = config.modResults.resources;
  const mainThemeIndex = style.findIndex(({ $ }) => $.name === 'AppTheme');
  if (mainThemeIndex === -1) {
    return config;
  }
  const mainTheme = style[mainThemeIndex];

  if (mainTheme != null) {
    const enforceIndex = mainTheme.item.findIndex(
      ({ $ }) => $.name === 'android:enforceNavigationBarContrast'
    );
    if (enforceIndex !== -1) {
      mainTheme.item[enforceIndex] = enforceNavigationBarContrastItem;
      return config;
    }

    config.modResults.resources.style = [
      {
        $: mainTheme.$,
        item: [enforceNavigationBarContrastItem, ...mainTheme.item],
      },
      ...style.filter(({ $ }) => $.name !== 'AppTheme'),
    ];
  }

  return config;
}

export default createRunOncePlugin(withNavigationBar, pkg.name, pkg.version);
