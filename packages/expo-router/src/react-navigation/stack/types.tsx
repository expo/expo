import type {
  HeaderBackButton,
  HeaderBackButtonDisplayMode,
  HeaderBackButtonProps,
  HeaderOptions,
  HeaderTitleProps,
} from '@react-navigation/elements';
import type {
  DefaultNavigatorOptions,
  Descriptor,
  LocaleDirection,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  Route,
  RouteProp,
  StackActionHelpers,
  StackNavigationState,
  StackRouterOptions,
  Theme,
} from '@react-navigation/native';
import type * as React from 'react';
import type { Animated, StyleProp, TextStyle, ViewStyle } from 'react-native';

export type StackNavigationEventMap = {
  /**
   * Event which fires when a transition animation starts.
   */
  transitionStart: { data: { closing: boolean } };
  /**
   * Event which fires when a transition animation ends.
   */
  transitionEnd: { data: { closing: boolean } };
  /**
   * Event which fires when navigation gesture starts.
   */
  gestureStart: { data: undefined };
  /**
   * Event which fires when navigation gesture is completed.
   */
  gestureEnd: { data: undefined };
  /**
   * Event which fires when navigation gesture is canceled.
   */
  gestureCancel: { data: undefined };
};

export type StackNavigationHelpers = NavigationHelpers<
  ParamListBase,
  StackNavigationEventMap
> &
  StackActionHelpers<ParamListBase>;

export type StackNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  StackNavigationState<ParamList>,
  StackNavigationOptions,
  StackNavigationEventMap
> &
  StackActionHelpers<ParamList>;

export type StackScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = {
  navigation: StackNavigationProp<ParamList, RouteName, NavigatorID>;
  route: RouteProp<ParamList, RouteName>;
};

export type StackOptionsArgs<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = StackScreenProps<ParamList, RouteName, NavigatorID> & {
  theme: Theme;
};

export type Layout = { width: number; height: number };

export type GestureDirection =
  | 'horizontal'
  | 'horizontal-inverted'
  | 'vertical'
  | 'vertical-inverted';

export type StackAnimationName =
  | 'default'
  | 'fade'
  | 'fade_from_bottom'
  | 'fade_from_right'
  | 'none'
  | 'reveal_from_bottom'
  | 'scale_from_center'
  | 'slide_from_bottom'
  | 'slide_from_right'
  | 'slide_from_left';

type SceneOptionsDefaults = TransitionPreset & {
  animation: StackAnimationName;
  gestureEnabled: boolean;
  cardOverlayEnabled: boolean;
  headerMode: StackHeaderMode;
};

export type Scene = {
  /**
   * Route object for the current screen.
   */
  route: Route<string>;
  /**
   * Descriptor object for the screen.
   */
  descriptor: Omit<StackDescriptor, 'options'> & {
    options: Omit<StackDescriptor['options'], keyof SceneOptionsDefaults> &
      SceneOptionsDefaults;
  };
  /**
   * Animated nodes representing the progress of the animation.
   */
  progress: SceneProgress;
};

export type SceneProgress = {
  /**
   * Progress value of the current screen.
   */
  current: Animated.AnimatedInterpolation<number>;
  /**
   * Progress value for the screen after this one in the stack.
   * This can be `undefined` in case the screen animating is the last one.
   */
  next?: Animated.AnimatedInterpolation<number>;
  /**
   * Progress value for the screen before this one in the stack.
   * This can be `undefined` in case the screen animating is the first one.
   */
  previous?: Animated.AnimatedInterpolation<number>;
};

export type StackHeaderMode = 'float' | 'screen';

export type StackPresentationMode = 'card' | 'modal';

export type StackHeaderOptions = Omit<
  HeaderOptions,
  'headerLeft' | 'headerTitle' | 'headerRight'
> & {
  /**
   * String or a function that returns a React Element to be used by the header.
   * Defaults to screen `title` or route name.
   *
   * It receives `allowFontScaling`, `tintColor`, `style` and `children` in the options object as an argument.
   * The title string is passed in `children`.
   */
  headerTitle?: string | ((props: HeaderTitleProps) => React.ReactNode);
  /**
   * Function which returns a React Element to display on the left side of the header.
   */
  headerLeft?: (props: StackHeaderLeftProps) => React.ReactNode;
  /**
   * Function which returns a React Element to display on the right side of the header.
   */
  headerRight?: (props: StackHeaderRightProps) => React.ReactNode;
  /**
   * Whether back button title font should scale to respect Text Size accessibility settings. Defaults to `false`.
   */
  headerBackAllowFontScaling?: boolean;
  /**
   * Accessibility label for the header back button.
   */
  headerBackAccessibilityLabel?: string;
  /**
   * ID to locate this back button in tests.
   */
  headerBackTestID?: string;
  /**
   * Title string used by the back button on iOS.
   * Defaults to the previous screen's title, or "Back" if there's not enough space.
   * Use `headerBackButtonDisplayMode` to customize the behavior.
   */
  headerBackTitle?: string;
  /**
   * Title string used by the back button when `headerBackTitle` doesn't fit on the screen.
   * Use `headerBackButtonDisplayMode` to customize the behavior.
   *
   * Defaults to "Back".
   */
  headerBackTruncatedTitle?: string;
  /**
   * How the back button displays icon and title.
   *
   * Supported values:
   * - "default" - Displays one of the following depending on the available space: previous screen's title, truncated title (e.g. 'Back') or no title (only icon).
   * - "generic" – Displays one of the following depending on the available space: truncated title (e.g. 'Back') or no title (only icon).
   * - "minimal" – Always displays only the icon without a title.
   *
   * Defaults to "default" on iOS, and "minimal" on other platforms.
   */
  headerBackButtonDisplayMode?: HeaderBackButtonDisplayMode;
  /**
   * Style object for the back title.
   */
  headerBackTitleStyle?: StyleProp<TextStyle>;
  /**
   * Function which returns a React Element to display custom image in header's back button.
   * It receives the `tintColor` in in the options object as an argument. object.
   * Defaults to Image component with a the default back icon image for the platform (a chevron on iOS and an arrow on Android).
   */
  headerBackImage?: React.ComponentProps<typeof HeaderBackButton>['backImage'];
};

export type StackHeaderProps = {
  /**
   * Layout of the screen.
   */
  layout: Layout;
  /**
   * Options for the back button.
   */
  back?: {
    /**
     * Title of the previous screen.
     */
    title: string | undefined;
    /**
     * The `href` to use for the anchor tag on web
     */
    href: string | undefined;
  };
  /**
   * Animated nodes representing the progress of the animation.
   */
  progress: SceneProgress;
  /**
   * Options for the current screen.
   */
  options: StackNavigationOptions;
  /**
   * Route object for the current screen.
   */
  route: Route<string>;
  /**
   * Navigation prop for the header.
   */
  navigation: StackNavigationProp<ParamListBase>;
  /**
   * Interpolated styles for various elements in the header.
   */
  styleInterpolator: StackHeaderStyleInterpolator;
};

export type StackHeaderRightProps = {
  /**
   * Tint color for the header button.
   */
  tintColor?: string;
  /**
   * Color for material ripple (Android >= 5.0 only).
   */
  pressColor?: string;
  /**
   * Opacity when the button is pressed, used when ripple is not supported.
   */
  pressOpacity?: number;
  /**
   * Whether it's possible to navigate back in stack.
   */
  canGoBack?: boolean;
};

export type StackHeaderLeftProps = HeaderBackButtonProps & {
  /**
   * Whether it's possible to navigate back in stack.
   */
  canGoBack?: boolean;
};

export type StackDescriptor = Descriptor<
  StackNavigationOptions,
  StackNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type StackDescriptorMap = Record<string, StackDescriptor>;

export type StackNavigationOptions = StackHeaderOptions &
  Partial<TransitionPreset> & {
    /**
     * String that can be displayed in the header as a fallback for `headerTitle`.
     */
    title?: string;
    /**
     * Function that given `HeaderProps` returns a React Element to display as a header.
     */
    header?: (props: StackHeaderProps) => React.ReactNode;
    /**
     * Whether the header floats above the screen or part of the screen.
     * Defaults to `float` on iOS for non-modals, and `screen` for the rest.
     */
    headerMode?: StackHeaderMode;
    /**
     * Whether to show the header. The header is shown by default.
     * Setting this to `false` hides the header.
     */
    headerShown?: boolean;
    /**
     * Whether a shadow is visible for the card during transitions. Defaults to `true`.
     */
    cardShadowEnabled?: boolean;
    /**
     * Whether to have a semi-transparent dark overlay visible under the card during transitions.
     * Defaults to `true` on Android and `false` on iOS.
     */
    cardOverlayEnabled?: boolean;
    /**
     * Function that returns a React Element to display as a overlay for the card.
     */
    cardOverlay?: (props: {
      style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
    }) => React.ReactNode;
    /**
     * Style object for the card in stack.
     * You can provide a custom background color to use instead of the default background here.
     *
     * You can also specify `{ backgroundColor: 'transparent' }` to make the previous screen visible underneath.
     * This is useful to implement things like modal dialogs.
     *
     * You should also specify `detachPreviousScreen: false` in options when using a transparent background
     * so that the previous screen isn't detached and stays below the current screen.
     *
     * You might also need to change the animation of the screen using `cardStyleInterpolator`
     * so that the previous screen isn't transformed or invisible.
     */
    cardStyle?: StyleProp<ViewStyle>;
    /**
     * Whether this screen should be presented as a modal or a regular card.
     *
     * Specifying this will configure several options:
     * - `card`: Use the default OS animations for iOS and Android screen transitions.
     * - `modal`: Use Modal animations. This changes a few things:
     *   - Sets `headerMode` to `screen` for the screen unless specified otherwise.
     *   - Changes the screen animation to match the platform behavior for modals.
     * - `transparentModal`: Similar to `modal`. This changes following things:
     *   - Sets `headerMode` to `screen` for the screen unless specified otherwise.
     *   - Sets background color of the screen to transparent, so previous screen is visible
     *   - Adjusts the `detachPreviousScreen` option so that the previous screen stays rendered.
     *   - Prevents the previous screen from animating from its last position.
     *   - Changes the screen animation to a vertical slide animation.
     *
     * Defaults to 'card'.
     */
    presentation?: 'card' | 'modal' | 'transparentModal';
    /**
     * How the screen should animate when pushed or popped.
     *
     * Supported values:
     * - 'none': don't animate the screen
     * - 'default': use the platform default animation
     * - 'fade': fade screen in or out
     * - 'fade_from_bottom': fade screen in or out from bottom
     * - 'slide_from_bottom': slide in the new screen from bottom
     * - 'slide_from_right': slide in the new screen from right
     * - 'slide_from_left': slide in the new screen from left
     * - 'reveal_from_bottom': reveal screen in from bottom to top
     * - 'scale_from_center': scale screen in from center
     */
    animation?: StackAnimationName;
    /**
     * The type of animation to use when this screen replaces another screen. Defaults to `push`.
     * When `pop` is used, the `pop` animation is applied to the screen being replaced.
     */
    animationTypeForReplace?: 'push' | 'pop';
    /**
     * Whether you can use gestures to dismiss this screen. Defaults to `true` on iOS, `false` on Android.
     * Not supported on Web.
     */
    gestureEnabled?: boolean;
    /**
     * Distance of touch start from the edge of the screen to recognize gestures.
     * Not supported on Web.
     */
    gestureResponseDistance?: number;
    /**
     * Number which determines the relevance of velocity for the gesture. Defaults to 0.3.
     * Not supported on Web.
     */
    gestureVelocityImpact?: number;
    /**
     * Whether to detach the previous screen from the view hierarchy to save memory.
     * Set it to `false` if you need the previous screen to be seen through the active screen.
     * Only applicable if `detachInactiveScreens` isn't set to `false`.
     * Defaults to `false` for the last screen for modals, otherwise `true`.
     */
    detachPreviousScreen?: boolean;
    /**
     * If `false`, the keyboard will NOT automatically dismiss when navigating to a new screen from this screen.
     * Defaults to `true`.
     */
    keyboardHandlingEnabled?: boolean;
    /**
     * Whether inactive screens should be suspended from re-rendering. Defaults to `false`.
     * Defaults to `true` when `enableFreeze()` is run at the top of the application.
     * Requires `react-native-screens` version >=3.16.0.
     *
     * Only supported on iOS and Android.
     */
    freezeOnBlur?: boolean;
    /**
     * Whether the home indicator should prefer to stay hidden on this screen. Defaults to `false`.
     *
     * @platform ios
     */
    autoHideHomeIndicator?: boolean;
  };

export type StackNavigationConfig = {
  /**
   * Whether inactive screens should be detached from the view hierarchy to save memory.
   * This will have no effect if you disable `react-native-screens`.
   *
   * Defaults to `true`.
   */
  detachInactiveScreens?: boolean;
};

export type TransitionSpec =
  | {
      animation: 'spring';
      config: Omit<
        Animated.SpringAnimationConfig,
        'toValue' | keyof Animated.AnimationConfig
      >;
    }
  | {
      animation: 'timing';
      config: Omit<
        Animated.TimingAnimationConfig,
        'toValue' | keyof Animated.AnimationConfig
      >;
    };

export type StackCardInterpolationProps = {
  /**
   * Values for the current screen.
   */
  current: {
    /**
     * Animated node representing the progress value of the current screen.
     */
    progress: Animated.AnimatedInterpolation<number>;
  };
  /**
   * Values for the screen after this one in the stack.
   * This can be `undefined` in case the screen animating is the last one.
   */
  next?: {
    /**
     * Animated node representing the progress value of the next screen.
     */
    progress: Animated.AnimatedInterpolation<number>;
  };
  /**
   * The index of the card with this interpolation in the stack.
   */
  index: number;
  /**
   * Animated node representing whether the card is closing (1 - closing, 0 - not closing).
   */
  closing: Animated.AnimatedInterpolation<0 | 1>;
  /**
   * Animated node representing whether the card is being swiped (1 - swiping, 0 - not swiping).
   */
  swiping: Animated.AnimatedInterpolation<0 | 1>;
  /**
   * Animated node representing multiplier when direction is inverted (-1 - inverted, 1 - normal).
   */
  inverted: Animated.AnimatedInterpolation<1 | -1>;
  /**
   * Layout measurements for various items we use for animation.
   */
  layouts: {
    /**
     * Layout of the whole screen.
     */
    screen: Layout;
  };
  /**
   * Safe area insets
   */
  insets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type StackCardInterpolatedStyle = {
  /**
   * Interpolated style for the container view wrapping the card.
   */
  containerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Interpolated style for the view representing the card.
   */
  cardStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Interpolated style for the view representing the semi-transparent overlay below the card.
   */
  overlayStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Interpolated style representing the card shadow.
   */
  shadowStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
};

export type StackCardStyleInterpolator = (
  props: StackCardInterpolationProps
) => StackCardInterpolatedStyle;

export type StackHeaderInterpolationProps = {
  /**
   * Values for the current screen (the screen which owns this header).
   */
  current: {
    /**
     * Animated node representing the progress value of the current screen.
     */
    progress: Animated.AnimatedInterpolation<number>;
  };
  /**
   * Values for the screen after this one in the stack.
   * This can be `undefined` in case the screen animating is the last one.
   */
  next?: {
    /**
     * Animated node representing the progress value of the next screen.
     */
    progress: Animated.AnimatedInterpolation<number>;
  };
  /**
   * Writing direction of the layout.
   */
  direction: LocaleDirection;
  /**
   * Layout measurements for various items we use for animation.
   */
  layouts: {
    /**
     * Layout of the header
     */
    header: Layout;
    /**
     * Layout of the whole screen.
     */
    screen: Layout;
    /**
     * Layout of the title element.
     */
    title?: Layout;
    /**
     * Layout of the back button label.
     */
    leftLabel?: Layout;
  };
};

export type StackHeaderInterpolatedStyle = {
  /**
   * Interpolated style for the label of the left button (back button label).
   */
  leftLabelStyle?: any;
  /**
   * Interpolated style for the left button (usually the back button).
   */
  leftButtonStyle?: any;
  /**
   * Interpolated style for the right button.
   */
  rightButtonStyle?: any;
  /**
   * Interpolated style for the header title text.
   */
  titleStyle?: any;
  /**
   * Interpolated style for the header background.
   */
  backgroundStyle?: any;
};

export type StackHeaderStyleInterpolator = (
  props: StackHeaderInterpolationProps
) => StackHeaderInterpolatedStyle;

export type TransitionPreset = {
  /**
   * The direction of swipe gestures, `horizontal` or `vertical`.
   */
  gestureDirection: GestureDirection;
  /**
   * Object which specifies the animation type (timing or spring) and their options (such as duration for timing).
   */
  transitionSpec: {
    /**
     * Transition configuration when adding a screen.
     */
    open: TransitionSpec;
    /**
     * Transition configuration when removing a screen.
     */
    close: TransitionSpec;
  };
  /**
   * Function which specifies interpolated styles for various parts of the card, e.g. the overlay, shadow etc.
   */
  cardStyleInterpolator: StackCardStyleInterpolator;
  /**
   * Function which specifies interpolated styles for various parts of the header, e.g. the title, left button etc.
   */
  headerStyleInterpolator: StackHeaderStyleInterpolator;
};

export type StackNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  StackNavigationState<ParamListBase>,
  StackNavigationOptions,
  StackNavigationEventMap,
  StackNavigationProp<ParamListBase>
> &
  StackRouterOptions &
  StackNavigationConfig;
