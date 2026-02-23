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
} from 'expo-navigation-bar';

const debug = Debug('expo:system-navigation-bar:plugin');

const pkg = require('expo-navigation-bar/package.json');

export type ResourceXMLConfig = ExportedConfigWithProps<AndroidConfig.Resources.ResourceXML>;

export type Props = {
  enforceContrast?: boolean;
  barStyle?: NavigationBarButtonStyle | null;
  visibility?: NavigationBarVisibility;

  /**
   * @deprecated
   */
  backgroundColor?: string | null;
  /**
   * @deprecated
   */
  behavior?: NavigationBarBehavior;
  /**
   * @deprecated
   */
  borderColor?: string;
  /**
   * @deprecated
   */
  position?: NavigationBarPosition;
};

const EDGE_TO_EDGE_DEPRECATION_MESSAGE =
  'property is deprecated due to Android 15 edge-to-edge enforcement and will be removed from Expo SDK';

// strings.xml keys, this should not change.
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';

const LEGACY_BAR_STYLE_MAP: Record<
  NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['barStyle']>,
  NavigationBarButtonStyle
> = {
  // Match expo-status-bar
  'dark-content': 'dark',
  'light-content': 'light',
};

export function resolveProps(
  config: Pick<ExpoConfig, 'androidNavigationBar'>,
  props: Props | void
): Props {
  if (!props) {
    const { androidNavigationBar } = config;

    return {
      enforceContrast: androidNavigationBar?.enforceContrast,
      barStyle: androidNavigationBar?.barStyle
        ? LEGACY_BAR_STYLE_MAP[androidNavigationBar?.barStyle]
        : undefined,
    };
  }

  if ('backgroundColor' in props) {
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar.backgroundColor',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }
  if ('behavior' in props) {
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar.behavior',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }
  if ('borderColor' in props) {
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar.borderColor',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }
  if ('position' in props) {
    WarningAggregator.addWarningAndroid(
      'androidNavigationBar.position',
      EDGE_TO_EDGE_DEPRECATION_MESSAGE
    );
  }

  return props;
}

/**
 * Ensure the Expo Go manifest is updated when the project is using config plugin properties instead
 * of the static values that Expo Go reads from (`androidNavigationBar`).
 */
export const withAndroidNavigationBarExpoGoManifest: ConfigPlugin<Props> = (config, props) => {
  if (!config.androidNavigationBar) {
    // Remap the config plugin props so Expo Go knows how to apply them.
    config.androidNavigationBar = {
      barStyle: Object.entries(LEGACY_BAR_STYLE_MAP).find(
        ([, v]) => v === props.barStyle
      )?.[0] as keyof typeof LEGACY_BAR_STYLE_MAP,
    };
  }
  return config;
};

const withNavigationBar: ConfigPlugin<Props | void> = (config, _props) => {
  const props = resolveProps(config, _props);

  config = withAndroidNavigationBarExpoGoManifest(config, props);

  debug('Props:', props);

  // TODO: Add this to expo/config-plugins
  // Elevate props to a static value on extra so Expo Go can read it.
  if (!config.extra) {
    config.extra = {};
  }
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
  { visibility }: Props
): AndroidConfig.Resources.ResourceXML {
  const stringItems: AndroidConfig.Resources.ResourceItemXML[] = [];

  if (visibility == null) {
    // Since we're using custom strings, we can remove them for convenience between prebuilds.
    strings = AndroidConfig.Strings.removeStringItem(VISIBILITY_KEY, strings);
  } else {
    stringItems.push(
      AndroidConfig.Resources.buildResourceItem({
        name: VISIBILITY_KEY,
        value: visibility,
        translatable: false,
      })
    );
  }

  return AndroidConfig.Strings.setStringItem(stringItems, strings);
}

const withNavigationBarStyles: ConfigPlugin<Props> = (config, props) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(props, config.modResults);
    return applyEnforceNavigationBarContrast(config, props.enforceContrast !== false);
  });
};

export function setNavigationBarStyles(
  { barStyle }: Props,
  styles: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setStyle('dark')` should do the same thing.
    add: barStyle === 'dark',
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
