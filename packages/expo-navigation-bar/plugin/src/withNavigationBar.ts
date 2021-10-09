import {
  ConfigPlugin,
  createRunOncePlugin,
  AndroidConfig,
  withStringsXml,
  WarningAggregator,
  withAndroidColors,
  withAndroidStyles,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
// @ts-ignore: uses flow
import normalizeColor from '@react-native/normalize-color';
import Debug from 'debug';

const debug = Debug('expo:system-navigation-bar:plugin');

const pkg = require('expo-navigation-bar/package.json');

export type Appearance = 'light' | 'dark';
export type Visibility = 'visible' | 'hidden';
export type Behavior = 'overlay-swipe' | 'inset-swipe' | 'inset-touch';
export type Position = 'relative' | 'absolute';

export type Props = {
  borderColor?: string;
  backgroundColor?: string | null;
  appearance?: Appearance | null;
  visibility?: Visibility;
  behavior?: Behavior;
  position?: Position;
  legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};

const BORDER_COLOR_KEY = 'expo_navigation_bar_border_color';
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
const POSITION_KEY = 'expo_navigation_bar_position';
const BEHAVIOR_KEY = 'expo_navigation_bar_behavior';
const LEGACY_VISIBLE_KEY = 'expo_navigation_bar_legacy_visible';

// styles.xml value
const NAVIGATION_BAR_COLOR = 'navigationBarColor';

const LEGACY_BAR_STYLE_MAP: Record<
  NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['barStyle']>,
  Appearance
> = {
  // These are flipped in the expo-cli config plugin
  'light-content': 'dark',
  'dark-content': 'light',
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

export function resolveProps(config: ExpoConfig, _props: Props | void): Props {
  let props: Props;
  if (!_props) {
    props = {
      backgroundColor: config.androidNavigationBar?.backgroundColor,
      appearance: config.androidNavigationBar?.barStyle
        ? LEGACY_BAR_STYLE_MAP[config.androidNavigationBar?.barStyle]
        : undefined,
      // Resources for:
      // - sticky-immersive: https://youtu.be/cBi8fjv90E4?t=416 -- https://developer.android.com/training/system-ui/immersive#sticky-immersive
      // - immersive: https://youtu.be/cBi8fjv90E4?t=168 -- https://developer.android.com/training/system-ui/immersive#immersive
      // - leanback: https://developer.android.com/training/system-ui/immersive#leanback
      legacyVisible: config.androidNavigationBar?.visible,
    };
    if (props.legacyVisible) {
      // TODO: Add an FYI that uses the new properties
      // Using legacyVisible can break the setPositionAsync method:
      // https://developer.android.com/reference/androidx/core/view/WindowCompat#setDecorFitsSystemWindows(android.view.Window,%20boolean)
      WarningAggregator.addWarningAndroid(
        'androidNavigationBar.visible',
        'visible property is deprecated in Android 30',
        'https://developer.android.com/reference/android/view/View.html#setSystemUiVisibility(int)'
      );
    }
  } else {
    props = _props;
  }
  return props;
}

const withNavigationBar: ConfigPlugin<Props | void> = (config, _props) => {
  const props = resolveProps(config, _props);

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
  }: Omit<Props, 'backgroundColor' | 'appearance'>
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

const withNavigationBarStyles: ConfigPlugin<Pick<Props, 'backgroundColor' | 'appearance'>> = (
  config,
  props
) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = setNavigationBarStyles(props, config.modResults);
    return config;
  });
};

export function setNavigationBarColors(
  { backgroundColor }: Pick<Props, 'backgroundColor' | 'appearance'>,
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
  { backgroundColor, appearance }: Pick<Props, 'backgroundColor' | 'appearance'>,
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
    // `setAppearanceAsync('light')` should do the same thing.
    add: appearance === 'light',
    parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
    name: 'android:windowLightNavigationBar',
    value: 'true',
  });

  return styles;
}

export default createRunOncePlugin(withNavigationBar, pkg.name, pkg.version);
