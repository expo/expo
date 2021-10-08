import {
  ConfigPlugin,
  createRunOncePlugin,
  AndroidConfig,
  withStringsXml,
  WarningAggregator,
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
  backgroundColor?: string;
  appearance?: Appearance;
  visibility?: Visibility;
  behavior?: Behavior;
  position?: Position;
  legacyVisible?: NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['visible']>;
};

const BACKGROUND_COLOR_KEY = 'expo_navigation_bar_background_color';
const BORDER_COLOR_KEY = 'expo_navigation_bar_border_color';
const APPEARANCE_KEY = 'expo_navigation_bar_appearance';
const VISIBILITY_KEY = 'expo_navigation_bar_visibility';
const POSITION_KEY = 'expo_navigation_bar_position';
const BEHAVIOR_KEY = 'expo_navigation_bar_behavior';
const LEGACY_VISIBLE_KEY = 'expo_navigation_bar_legacy_visible';

const LEGACY_BAR_STYLE_MAP: Record<
  NonNullable<NonNullable<ExpoConfig['androidNavigationBar']>['barStyle']>,
  Appearance
> = {
  'light-content': 'light',
  'dark-content': 'dark',
};

function convertColor(input: string): number {
  const color = normalizeColor(input);
  if (!color) {
    throw new Error('Invalid color value: ' + input);
  }
  return ((color << 24) | (color >>> 8)) >>> 0;
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
        'androidNavigationBar',
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

  return withStringsXml(config, (config) => {
    config.modResults = setStrings(config.modResults, props);
    return config;
  });
};

export function setStrings(
  strings: AndroidConfig.Resources.ResourceXML,
  { backgroundColor, borderColor, appearance, visibility, position, behavior, legacyVisible }: Props
): AndroidConfig.Resources.ResourceXML {
  const pairs = [
    [BACKGROUND_COLOR_KEY, backgroundColor ? convertColor(backgroundColor) : null],
    [BORDER_COLOR_KEY, borderColor ? convertColor(borderColor) : null],
    [APPEARANCE_KEY, appearance],
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

export default createRunOncePlugin(withNavigationBar, pkg.name, pkg.version);
