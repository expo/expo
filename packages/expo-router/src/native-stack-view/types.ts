import type {
  ParamListBase,
  RouteProp,
  ScreenListeners,
  StackNavigationState,
} from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type {
  BlurEffectTypes,
  GestureResponseDistanceType,
  ScrollEdgeEffect,
  ScreenOrientationTypes,
  StackAnimationTypes,
  StackPresentationTypes,
  SwipeDirectionTypes,
} from 'react-native-screens';

/**
 * Presentation types supported by NativeStack.
 *
 * Includes `card` (maps to `push`) in addition to the native presentation types.
 */
export type NativeStackPresentation = 'card' | StackPresentationTypes;

/**
 * Screen options for `NativeStack` screens.
 *
 * These options map to `ScreenStackItem` and `ScreenStackHeaderConfig` props from `react-native-screens`.
 */
export interface NativeStackOptions {
  // #region Header
  /** Screen title displayed in the header. Falls back to the route name. */
  title?: string;
  /** Whether to show the header. @default true */
  headerShown?: boolean;
  /** Title displayed on the back button. @platform ios */
  headerBackTitle?: string;
  /**
   * Controls the back button display mode.
   * @platform ios
   */
  headerBackButtonDisplayMode?: 'default' | 'generic' | 'minimal';
  /** Tint color for the header elements (back button, title on iOS). */
  headerTintColor?: ColorValue;
  /** Background color of the header. */
  headerBackgroundColor?: ColorValue;
  /** Blur effect applied to the header background. @platform ios */
  headerBlurEffect?: BlurEffectTypes;
  /** Whether to use a large title header style. @platform ios */
  headerLargeTitle?: boolean;
  /** Background color for the large title header. @platform ios */
  headerLargeTitleBackgroundColor?: ColorValue;
  /** Whether the header shadow (bottom border) is visible. @default true */
  headerShadowVisible?: boolean;
  /** Whether the header is transparent. */
  headerTransparent?: boolean;
  /** Style for the header title text. Supports `fontFamily`, `fontSize`, `fontWeight`, `color`. */
  headerTitleStyle?: StyleProp<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'color'>>;
  /** Style for the large title text. Supports `fontFamily`, `fontSize`, `fontWeight`, `color`. @platform ios */
  headerLargeTitleStyle?: StyleProp<
    Pick<TextStyle, 'fontFamily' | 'fontSize' | 'fontWeight' | 'color'>
  >;
  // #endregion

  // #region Presentation
  /**
   * Screen presentation style.
   * - `card` / `push` - standard push transition
   * - `modal` - modal presentation
   * - `transparentModal` - transparent modal
   * - `containedModal` - contained modal
   * - `containedTransparentModal` - contained transparent modal
   * - `fullScreenModal` - full screen modal
   * - `formSheet` - form sheet (iOS)
   * - `pageSheet` - page sheet (iOS)
   *
   * @default 'card'
   */
  presentation?: NativeStackPresentation;
  /** Stack animation type. */
  animation?: StackAnimationTypes;
  /** Duration of the transition animation in milliseconds. @platform ios */
  animationDuration?: number;
  /**
   * Animation type used when replacing a screen.
   * @default 'push'
   */
  animationTypeForReplace?: 'push' | 'pop';
  // #endregion

  // #region Gestures
  /** Whether the swipe-back gesture is enabled. @platform ios */
  gestureEnabled?: boolean;
  /** Whether full-screen swipe-back gesture is enabled. @platform ios */
  fullScreenSwipeEnabled?: boolean;
  /** Configures the gesture response area. @platform ios */
  gestureResponseDistance?: GestureResponseDistanceType;
  /** Direction of the swipe gesture. @platform ios */
  swipeDirection?: SwipeDirectionTypes;
  // #endregion

  // #region Form sheet
  /**
   * Allowed detents for sheet presentation.
   * @platform ios
   */
  sheetAllowedDetents?: number[] | 'fitToContents' | 'medium' | 'large' | 'all';
  /** Whether to show the sheet grabber. @platform ios */
  sheetGrabberVisible?: boolean;
  /** Corner radius of the sheet. @platform ios */
  sheetCornerRadius?: number;
  /** Whether the sheet expands when scrolled to the edge. @platform ios */
  sheetExpandsWhenScrolledToEdge?: boolean;
  /** Initial detent index for the sheet. @platform ios */
  sheetInitialDetentIndex?: number | 'last';
  /** Largest undimmed detent index for the sheet. @platform ios */
  sheetLargestUndimmedDetentIndex?: number | 'none' | 'last' | 'medium' | 'large' | 'all';
  /** Elevation of the sheet. @platform android */
  sheetElevation?: number;
  // #endregion

  // #region Status bar
  /** Status bar style. */
  statusBarStyle?: 'inverted' | 'auto' | 'light' | 'dark';
  /** Whether the status bar is hidden. */
  statusBarHidden?: boolean;
  /** Status bar animation type. */
  statusBarAnimation?: 'none' | 'fade' | 'slide';
  /** Whether the status bar should be translucent. @platform android */
  statusBarTranslucent?: boolean;
  /** Background color of the status bar. @platform android */
  statusBarBackgroundColor?: ColorValue;
  // #endregion

  // #region Navigation bar (Android)
  /** Whether the Android navigation bar is hidden. @platform android */
  navigationBarHidden?: boolean;
  /** Color of the Android navigation bar. @platform android */
  navigationBarColor?: ColorValue;
  /** Whether the Android navigation bar is translucent. @platform android */
  navigationBarTranslucent?: boolean;
  // #endregion

  // #region Other
  /** Screen orientation. */
  orientation?: ScreenOrientationTypes;
  /** Style applied to the screen content container. */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to freeze the screen when it's not focused.
   * @default true
   */
  freezeOnBlur?: boolean;
  /** Whether to hide the home indicator. @platform ios */
  homeIndicatorHidden?: boolean;
  /** Whether to hide the keyboard on swipe. @platform ios */
  hideKeyboardOnSwipe?: boolean;
  /**
   * Scroll edge effects configuration.
   * @platform ios 26+
   */
  scrollEdgeEffects?: {
    bottom?: ScrollEdgeEffect;
    left?: ScrollEdgeEffect;
    right?: ScrollEdgeEffect;
    top?: ScrollEdgeEffect;
  };
  // #endregion
}

/**
 * Event map for `NativeStack` navigation events.
 */
export type NativeStackNavigationEventMap = {
  transitionStart: { data: { closing: boolean } };
  transitionEnd: { data: { closing: boolean } };
};

/**
 * Props for the `NativeStack` component.
 */
export interface NativeStackProps extends PropsWithChildren {
  /**
   * Default options for all screens in the stack.
   */
  screenOptions?:
    | NativeStackOptions
    | ((props: { route: RouteProp<ParamListBase, string>; navigation: any }) => NativeStackOptions);
  /**
   * Listeners for navigation events on all screens.
   */
  screenListeners?:
    | ScreenListeners<StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>
    | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenListeners<StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>);
}
