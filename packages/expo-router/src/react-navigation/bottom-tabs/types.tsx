import type {
  HeaderOptions,
  PlatformPressable,
} from '@react-navigation/elements';
import type {
  DefaultNavigatorOptions,
  Descriptor,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  RouteProp,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
  Theme,
} from '@react-navigation/native';
import type * as React from 'react';
import type {
  Animated,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

export type Layout = { width: number; height: number };

export type Variant = 'uikit' | 'material';

export type BottomTabNavigationEventMap = {
  /**
   * Event which fires on tapping on the tab in the tab bar.
   */
  tabPress: { data: undefined; canPreventDefault: true };
  /**
   * Event which fires on long press on the tab in the tab bar.
   */
  tabLongPress: { data: undefined };
  /**
   * Event which fires when a transition animation starts.
   */
  transitionStart: { data: undefined };
  /**
   * Event which fires when a transition animation ends.
   */
  transitionEnd: { data: undefined };
};

export type LabelPosition = 'beside-icon' | 'below-icon';

export type BottomTabNavigationHelpers = NavigationHelpers<
  ParamListBase,
  BottomTabNavigationEventMap
> &
  TabActionHelpers<ParamListBase>;

export type BottomTabNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  TabNavigationState<ParamList>,
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap
> &
  TabActionHelpers<ParamList>;

export type BottomTabScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = {
  navigation: BottomTabNavigationProp<ParamList, RouteName, NavigatorID>;
  route: RouteProp<ParamList, RouteName>;
};

export type BottomTabOptionsArgs<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = BottomTabScreenProps<ParamList, RouteName, NavigatorID> & {
  theme: Theme;
};

export type TimingKeyboardAnimationConfig = {
  animation: 'timing';
  config?: Omit<
    Partial<Animated.TimingAnimationConfig>,
    'toValue' | 'useNativeDriver'
  >;
};

export type SpringKeyboardAnimationConfig = {
  animation: 'spring';
  config?: Omit<
    Partial<Animated.SpringAnimationConfig>,
    'toValue' | 'useNativeDriver'
  >;
};

export type TabBarVisibilityAnimationConfig =
  | TimingKeyboardAnimationConfig
  | SpringKeyboardAnimationConfig;

export type TabAnimationName = 'none' | 'fade' | 'shift';

export type BottomTabNavigationOptions = HeaderOptions & {
  /**
   * Title text for the screen.
   */
  title?: string;

  /**
   * Title string of a tab displayed in the tab bar
   * or a function that given { focused: boolean, color: string, position: 'below-icon' | 'beside-icon', children: string } returns a React.Node to display in tab bar.
   *
   * When undefined, scene title is used. Use `tabBarShowLabel` to hide the label.
   */
  tabBarLabel?:
    | string
    | ((props: {
        focused: boolean;
        color: string;
        position: LabelPosition;
        children: string;
      }) => React.ReactNode);

  /**
   * Whether the tab label should be visible. Defaults to `true`.
   */
  tabBarShowLabel?: boolean;

  /**
   * Whether the label is shown below the icon or beside the icon.
   *
   * - `below-icon`: the label is shown below the icon (typical for iPhones)
   * - `beside-icon` the label is shown next to the icon (typical for iPad)
   *
   * By default, the position is chosen automatically based on device width.
   */
  tabBarLabelPosition?: LabelPosition;

  /**
   * Style object for the tab label.
   */
  tabBarLabelStyle?: StyleProp<TextStyle>;

  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  tabBarAllowFontScaling?: boolean;

  /**
   * A function that given { focused: boolean, color: string } returns a React.Node to display in the tab bar.
   */
  tabBarIcon?: (props: {
    focused: boolean;
    color: string;
    size: number;
  }) => React.ReactNode;

  /**
   * Style object for the tab icon.
   */
  tabBarIconStyle?: StyleProp<TextStyle>;

  /**
   * Text to show in a badge on the tab icon.
   */
  tabBarBadge?: number | string;

  /**
   * Custom style for the tab bar badge.
   * You can specify a background color or text color here.
   */
  tabBarBadgeStyle?: StyleProp<TextStyle>;

  /**
   * Accessibility label for the tab button. This is read by the screen reader when the user taps the tab.
   * It's recommended to set this if you don't have a label for the tab.
   */
  tabBarAccessibilityLabel?: string;

  /**
   * ID to locate this tab button in tests.
   */
  tabBarButtonTestID?: string;

  /**
   * Function which returns a React element to render as the tab bar button.
   * Renders `PlatformPressable` by default.
   */
  tabBarButton?: (props: BottomTabBarButtonProps) => React.ReactNode;

  /**
   * Color for the icon and label in the active tab.
   */
  tabBarActiveTintColor?: string;

  /**
   * Color for the icon and label in the inactive tabs.
   */
  tabBarInactiveTintColor?: string;

  /**
   * Background color for the active tab.
   */
  tabBarActiveBackgroundColor?: string;

  /**
   * Background color for the inactive tabs.
   */
  tabBarInactiveBackgroundColor?: string;

  /**
   * Style object for the tab item container.
   */
  tabBarItemStyle?: StyleProp<ViewStyle>;

  /**
   * Whether the tab bar gets hidden when the keyboard is shown. Defaults to `false`.
   */
  tabBarHideOnKeyboard?: boolean;

  /**
   * Animation config for showing and hiding the tab bar when the keyboard is shown/hidden.
   */
  tabBarVisibilityAnimationConfig?: {
    show?: TabBarVisibilityAnimationConfig;
    hide?: TabBarVisibilityAnimationConfig;
  };

  /**
   * Variant of the tab bar. Defaults to `uikit`.
   */
  tabBarVariant?: Variant;

  /**
   * Style object for the tab bar container.
   */
  tabBarStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;

  /**
   * Function which returns a React Element to use as background for the tab bar.
   * You could render an image, a gradient, blur view etc.
   *
   * When using `BlurView`, make sure to set `position: 'absolute'` in `tabBarStyle` as well.
   * You'd also need to use `useBottomTabBarHeight()` to add a bottom padding to your content.
   */
  tabBarBackground?: () => React.ReactNode;

  /**
   * Position of the tab bar on the screen. Defaults to `bottom`.
   */
  tabBarPosition?: 'bottom' | 'left' | 'right' | 'top';

  /**
   * Whether this screens should render the first time it's accessed. Defaults to `true`.
   * Set it to `false` if you want to render the screen on initial render.
   */
  lazy?: boolean;

  /**
   * Function that given returns a React Element to display as a header.
   */
  header?: (props: BottomTabHeaderProps) => React.ReactNode;

  /**
   * Whether to show the header. Setting this to `false` hides the header.
   * Defaults to `true`.
   */
  headerShown?: boolean;

  /**
   * Whether any nested stack should be popped to top when navigating away from the tab.
   * Defaults to `false`.
   */
  popToTopOnBlur?: boolean;

  /**
   * Whether inactive screens should be suspended from re-rendering. Defaults to `false`.
   * Defaults to `true` when `enableFreeze()` is run at the top of the application.
   * Requires `react-native-screens` version >=3.16.0.
   *
   * Only supported on iOS and Android.
   */
  freezeOnBlur?: boolean;

  /**
   * Style object for the component wrapping the screen content.
   */
  sceneStyle?: StyleProp<ViewStyle>;

  /**
   * How the screen should animate when switching tabs.
   *
   * Supported values:
   * - 'none': don't animate the screen (default)
   * - 'fade': cross-fade the screens.
   * - 'shift': shift the screens slightly shift to left/right.
   */
  animation?: TabAnimationName;

  /**
   * Function which specifies interpolated styles for bottom-tab scenes.
   */
  sceneStyleInterpolator?: BottomTabSceneStyleInterpolator;

  /**
   * Object which specifies the animation type (timing or spring) and their options (such as duration for timing).
   */
  transitionSpec?: TransitionSpec;
};

export type BottomTabDescriptor = Descriptor<
  BottomTabNavigationOptions,
  BottomTabNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type BottomTabDescriptorMap = Record<string, BottomTabDescriptor>;

export type BottomTabSceneInterpolationProps = {
  /**
   * Values for the current screen.
   */
  current: {
    /**
     * Animated value for the current screen:
     * - -1 if the index is lower than active tab,
     * - 0 if they're active,
     * - 1 if the index is higher than active tab
     */
    progress: Animated.Value;
  };
};

export type BottomTabSceneInterpolatedStyle = {
  /**
   * Interpolated style for the view representing the scene containing screen content.
   */
  sceneStyle: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
};

export type BottomTabSceneStyleInterpolator = (
  props: BottomTabSceneInterpolationProps
) => BottomTabSceneInterpolatedStyle;

export type TransitionSpec =
  | {
      animation: 'timing';
      config: Omit<
        Animated.TimingAnimationConfig,
        'toValue' | keyof Animated.AnimationConfig
      >;
    }
  | {
      animation: 'spring';
      config: Omit<
        Animated.SpringAnimationConfig,
        'toValue' | keyof Animated.AnimationConfig
      >;
    };

export type BottomTabTransitionPreset = {
  /**
   * Whether transition animations should be enabled when switching tabs.
   */
  animationEnabled?: boolean;

  /**
   * Function which specifies interpolated styles for bottom-tab scenes.
   */
  sceneStyleInterpolator?: BottomTabSceneStyleInterpolator;

  /**
   * Object which specifies the animation type (timing or spring) and their options (such as duration for timing).
   */
  transitionSpec?: TransitionSpec;
};

export type BottomTabNavigationConfig = {
  /**
   * Function that returns a React element to display as the tab bar.
   */
  tabBar?: (props: BottomTabBarProps) => React.ReactNode;
  /**
   * Safe area insets for the tab bar. This is used to avoid elements like the navigation bar on Android and bottom safe area on iOS.
   * By default, the device's safe area insets are automatically detected. You can override the behavior with this option.
   */
  safeAreaInsets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /**
   * Whether inactive screens should be detached from the view hierarchy to save memory.
   * Make sure to call `enableScreens` from `react-native-screens` to make it work.
   * Defaults to `true` on Android.
   */
  detachInactiveScreens?: boolean;
};

export type BottomTabHeaderProps = {
  /**
   * Layout of the screen.
   */
  layout: Layout;
  /**
   * Options for the current screen.
   */
  options: BottomTabNavigationOptions;
  /**
   * Route object for the current screen.
   */
  route: RouteProp<ParamListBase>;
  /**
   * Navigation prop for the header.
   */
  navigation: BottomTabNavigationProp<ParamListBase>;
};

export type BottomTabBarProps = {
  state: TabNavigationState<ParamListBase>;
  descriptors: BottomTabDescriptorMap;
  navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
  insets: EdgeInsets;
};

export type BottomTabBarButtonProps = Omit<
  React.ComponentProps<typeof PlatformPressable>,
  'style'
> & {
  href?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => void;
};

export type BottomTabNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TabNavigationState<ParamListBase>,
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
  BottomTabNavigationProp<ParamListBase>
> &
  TabRouterOptions &
  BottomTabNavigationConfig;
