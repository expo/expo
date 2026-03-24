import Debug from 'debug';
import { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  ExportedConfigWithProps,
  createRunOncePlugin,
  WarningAggregator,
  withAndroidStyles,
  withStringsXml,
} from 'expo/config-plugins';

import {
  NavigationBarBehavior,
  NavigationBarButtonStyle,
  NavigationBarPosition,
  NavigationBarVisibility,
} from '../..';

const debug = Debug('expo:system-navigation-bar:plugin');

const pkg = require('../../package.json');

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;

type AndroidNavigationBar = NonNullable<ExpoConfig['androidNavigationBar']>;
type LegacyNavigationBarStyle = NonNullable<AndroidNavigationBar['barStyle']>;
type NavigationBarStyle = 'light' | 'dark';

export type Props = {
  enforceContrast?: boolean;
  hidden?: boolean;
  style?: NavigationBarStyle;

  /** @deprecated */
  barStyle?: NavigationBarButtonStyle | null;
  /** @deprecated */
  visibility?: NavigationBarVisibility;
  /** @deprecated */
  backgroundColor?: string | null;
  /** @deprecated */
  behavior?: NavigationBarBehavior;
  /** @deprecated */
  borderColor?: string;
  /** @deprecated */
  position?: NavigationBarPosition;
};

type ResolvedProps = {
  enforceContrast?: boolean;
  hidden?: boolean;
  style?: NavigationBarStyle;
  visible?: AndroidNavigationBar['visible'];
};

const EDGE_TO_EDGE_DEPRECATION_MESSAGE =
  'property is deprecated due to Android 15 edge-to-edge enforcement and will be removed from Expo SDK';

// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';

const LEGACY_BAR_STYLE_MAP: Record<LegacyNavigationBarStyle, NavigationBarStyle> = {
  // Match expo-status-bar
  'dark-content': 'dark',
  'light-content': 'light',
};

export function resolveProps(
  config: Pick<ExpoConfig, 'androidNavigationBar'>,
  props: Props | void
): ResolvedProps {
  if (props == null) {
    const { androidNavigationBar = {} } = config;
    const { barStyle, visible } = androidNavigationBar;

    return {
      enforceContrast: androidNavigationBar.enforceContrast,
      hidden: visible != null ? true : undefined,
      style: barStyle != null ? LEGACY_BAR_STYLE_MAP[barStyle] : undefined,
      visible,
    };
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
  if ('behavior' in props) {
    WarningAggregator.addWarningAndroid(
      'expo-navigation-bar behavior',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }
  if ('borderColor' in props) {
    WarningAggregator.addWarningAndroid(
      'expo-navigation-bar borderColor',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }
  if ('position' in props) {
    WarningAggregator.addWarningAndroid(
      'expo-navigation-bar position',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }

  const hidden =
    props.hidden ?? (props.visibility == null ? undefined : props.visibility === 'hidden');

  return {
    enforceContrast: props.enforceContrast,
    hidden,
    visible: hidden ? 'leanback' : undefined,
    style: props.style ?? props.barStyle ?? undefined,
  };
}

/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<ResolvedProps> = (
  config,
  props
) => {
  if (config.androidNavigationBar != null) {
    return config;
  }

  const barStyle = Object.entries(LEGACY_BAR_STYLE_MAP).find(
    ([, value]) => value === props.style
  )?.[0] as LegacyNavigationBarStyle;

  // Remap the config plugin props so Expo Go knows how to apply them.
  config.androidNavigationBar = { barStyle, visible: props.visible };

  return config;
};

const withNavigationBar: ConfigPlugin<Props | void> = (config, _props) => {
  const props = resolveProps(config, _props);

  config = withAndroidNavigationBarExpoGoManifest(config, props);

  debug('Props:', props);

  // TODO: Add this to expo/config-plugins
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
  { hidden }: ResolvedProps
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

const withNavigationBarStyles: ConfigPlugin<ResolvedProps> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(props, config.modResults);
    return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
  });
};

export function setNavigationBarStyles(
  { style }: ResolvedProps,
  styles: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: style === 'dark',
    parent: AndroidConfig.Styles.getAppThemeGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true',
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
  const enforceIndex = mainTheme.item.findIndex(
    ({ $ }) => $.name === 'android:enforceNavigationBarContrast'
  );
  if (enforceIndex !== -1) {
    style[mainThemeIndex].item[enforceIndex] = enforceNavigationBarContrastItem;
    return config;
  }

  config.modResults.resources.style = [
    {
      $: style[mainThemeIndex].$,
      item: [enforceNavigationBarContrastItem, ...mainTheme.item],
    },
    ...style.filter(({ $ }) => $.name !== 'AppTheme'),
  ];

  return config;
}

export default createRunOncePlugin(withNavigationBar, pkg.name, pkg.version);
