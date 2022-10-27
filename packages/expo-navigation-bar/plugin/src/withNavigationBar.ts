// @ts-ignore: uses flow
import normalizeColor from '@react-native/normalize-color';
// @ts-ignore
import Debug from 'debug';
import {
  NavigationBarVisibility,
  NavigationBarBehavior,
  NavigationBarPosition,
  NavigationBarButtonStyle,
} from 'expo-navigation-bar';
import { ExpoConfig } from 'expo/config';
import {
  ConfigPlugin,
  createRunOncePlugin,
  AndroidConfig,
  withStringsXml,
  WarningAggregator,
  withAndroidColors,
  withAndroidStyles,
} from 'expo/config-plugins';

const debug = Debug('expo:system-navigation-bar:plugin');

const pkg = require('expo-navigation-bar/package.json');

export type Props = {
  borderColor?: string;
  backgroundColor?: string | null;
  barStyle?: NavigationBarButtonStyle | null;
  visibility?: NavigationBarVisibility;
  behavior?: NavigationBarBehavior;
  position?: NavigationBarPosition;
  legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};

// strings.xml keys, this should not change.
const BORDER_COLOR_KEY = 'expo_navigation_bar_border_color';
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
const POSITION_KEY = 'expo_navigation_bar_position';
const BEHAVIOR_KEY = 'expo_navigation_bar_behavior';
const LEGACY_VISIBLE_KEY = 'expo_navigation_bar_legacy_visible';

// styles.xml value
const NAVIGATION_BAR_COLOR = 'navigationBarColor';

const LEGACY_BAR_STYLE_MAP: Record<
  NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['barStyle']>,
  NavigationBarButtonStyle
> = {
  // Match expo-status-bar
  'dark-content': 'dark',
  'light-content': 'light',
};

function convertColorAndroid(input: string): number {
  let color = normalizeColor(input);
  if (!color) {
    throw new Error('Invalid color value: ' + input);
  }
  color = ((color << 24) | (color >>> 8)) >>> 0;

  // Android use 32 bit *signed* integer to represent the color
  // We utilize the fact that bitwise operations in JS also operates on
  // signed 32 bit integers, so that we can use those to convert from
  // *unsigned* to *signed* 32bit int that way.
  return color | 0x0;
}

export function resolveProps(
  config: Pick<ExpoConfig, 'androidNavigationBar'>,
  _props: Props | void
): Props {
  let props: Props;
  if (!_props) {
    props = {
      backgroundColor: config.androidNavigationBar?.backgroundColor,
      barStyle: config.androidNavigationBar?.barStyle
        ? LEGACY_BAR_STYLE_MAP[config.androidNavigationBar?.barStyle]
        : undefined,
      // Resources for:
      // - sticky-immersive: https://youtu.be/cBi8fjv90E4?t=416 -- https://developer.android.com/training/system-ui/immersive#sticky-immersive
      // - immersive: https://youtu.be/cBi8fjv90E4?t=168 -- https://developer.android.com/training/system-ui/immersive#immersive
      // - leanback: https://developer.android.com/training/system-ui/immersive#leanback
      legacyVisible: config.androidNavigationBar?.visible,
    };
    if (props.legacyVisible) {
      // Using legacyVisible can break the setPositionAsync method:
      // https://developer.android.com/reference/androidx/core/view/WindowCompat#setDecorFitsSystemWindows(android.view.Window,%20boolean)
      WarningAggregator.addWarningAndroid(
        'androidNavigationBar.visible',
        'property is deprecated in Android 11 (API 30) and will be removed from Expo SDK',
        'https://expo.fyi/android-navigation-bar-visible-deprecated'
      );
    }
  } else {
    props = _props;
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
      backgroundColor: props.backgroundColor ?? undefined,
      barStyle: Object.entries(LEGACY_BAR_STYLE_MAP).find(
        ([, v]) => v === props.barStyle
      )?.[0] as keyof typeof LEGACY_BAR_STYLE_MAP,
      visible: props.legacyVisible,
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
  config = withNavigationBarColors(config, props);
  config = withNavigationBarStyles(config, props);

  return withStringsXml(config, (config) => {
    config.modResults = setStrings(config.modResults, props);
    return config;
  });
};

export function setStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  {
    borderColor,
    visibility,
    position,
    behavior,
    legacyVisible,
  }: Omit<Props, 'backgroundColor' | 'barStyle'>
): AndroidConfig.Resources.ResourceXML {
  const pairs = [
    [BORDER_COLOR_KEY, borderColor ? convertColorAndroid(borderColor) : null],
    [VISIBILITY_KEY, visibility],
    [POSITION_KEY, position],
    [BEHAVIOR_KEY, behavior],
    [LEGACY_VISIBLE_KEY, legacyVisible],
  ] as [string, any][];

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

const withNavigationBarColors: ConfigPlugin<Pick<Props, 'backgroundColor'>> = (config, props) => {
  return withAndroidColors(config, (config) => {
    config.modResults = setNavigationBarColors(props, config.modResults);
    return config;
  });
};

const withNavigationBarStyles: ConfigPlugin<Pick<Props, 'backgroundColor' | 'barStyle'>> = (
  config,
  props
) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(props, config.modResults);
    return config;
  });
};

export function setNavigationBarColors(
  { backgroundColor }: Pick<Props, 'backgroundColor'>,
  colors: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  if (backgroundColor) {
    colors = AndroidConfig.Colors.setColorItem(
      AndroidConfig.Resources.buildResourceItem({
        name: NAVIGATION_BAR_COLOR,
        value: backgroundColor,
      }),
      colors
    );
  }
  return colors;
}

export function setNavigationBarStyles(
  { backgroundColor, barStyle }: Pick<Props, 'backgroundColor' | 'barStyle'>,
  styles: AndroidConfig.Resources.ResourceXML
): AndroidConfig.Resources.ResourceXML {
  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    add: !!backgroundColor,
    parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
    name: `android:${NAVIGATION_BAR_COLOR}`,
    value: `@color/${NAVIGATION_BAR_COLOR}`,
  });

  styles = AndroidConfig.Styles.assignStylesValue(styles, {
    // Adding means the buttons will be darker to account for a light background color.
    // `setButtonStyleAsync('dark')` should do the same thing.
    add: barStyle === 'dark',
    parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true',
  });

  return styles;
}

export default createRunOncePlugin(withNavigationBar, pkg.name, pkg.version);
