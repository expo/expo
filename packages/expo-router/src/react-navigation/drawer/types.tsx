import type { HeaderOptions } from '@react-navigation/elements';
import type {
  DefaultNavigatorOptions,
  Descriptor,
  DrawerActionHelpers,
  DrawerNavigationState,
  DrawerRouterOptions,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  Route,
  RouteProp,
  Theme,
} from '@react-navigation/native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { PanGesture } from 'react-native-gesture-handler';

export type Scene = {
  route: Route<string>;
  focused: boolean;
  color?: string;
};

export type Layout = { width: number; height: number };

export type DrawerNavigationConfig = {
  /**
   * Function that returns React element to render as the content of the drawer, for example, navigation items.
   * Defaults to `DrawerContent`.
   */
  drawerContent?: (props: DrawerContentComponentProps) => React.ReactNode;
  /**
   * Whether inactive screens should be detached from the view hierarchy to save memory.
   * Make sure to call `enableScreens` from `react-native-screens` to make it work.
   * Defaults to `true`.
   */
  detachInactiveScreens?: boolean;
};

export type DrawerNavigationOptions = HeaderOptions & {
  /**
   * Title text for the screen.
   */
  title?: string;

  /**
   * Whether this screens should render the first time it's accessed. Defaults to `true`.
   * Set it to `false` if you want to render the screen on initial render.
   */
  lazy?: boolean;

  /**
   * Function that returns a React Element to display as a header.
   */
  header?: (props: DrawerHeaderProps) => React.ReactNode;

  /**
   * Whether to show the header. Setting this to `false` hides the header.
   * Defaults to `true`.
   */
  headerShown?: boolean;

  /**
   * Title string of a screen displayed in the drawer
   * or a function that given { focused: boolean, color: string } returns a React.Node
   * When undefined, scene title is used.
   */
  drawerLabel?:
    | string
    | ((props: { color: string; focused: boolean }) => React.ReactNode);

  /**
   * A function that given { focused: boolean, color: string } returns a React.Node to display an icon the drawer.
   */
  drawerIcon?: (props: {
    color: string;
    size: number;
    focused: boolean;
  }) => React.ReactNode;

  /**
   * Color for the icon and label in the active item in the drawer.
   */
  drawerActiveTintColor?: string;

  /**
   * Background color for the active item in the drawer.
   */
  drawerActiveBackgroundColor?: string;

  /**
   * Color for the icon and label in the inactive items in the drawer.
   */
  drawerInactiveTintColor?: string;

  /**
   * Background color for the inactive items in the drawer.
   */
  drawerInactiveBackgroundColor?: string;

  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  drawerAllowFontScaling?: boolean;

  /**
   * Style object for the single item, which can contain an icon and/or a label.
   */
  drawerItemStyle?: StyleProp<ViewStyle>;

  /**
   * Style object to apply to the `Text` inside content section which renders a label.
   */
  drawerLabelStyle?: StyleProp<TextStyle>;

  /**
   * Style object for the content section.
   */
  drawerContentContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the wrapper view.
   */
  drawerContentStyle?: StyleProp<ViewStyle>;

  /**
   * Style object for the drawer component.
   * You can pass a custom background color for a drawer or a custom width here.
   */
  drawerStyle?: StyleProp<ViewStyle>;

  /**
   * Position of the drawer on the screen. Defaults to `left`.
   */
  drawerPosition?: 'left' | 'right';

  /**
   * Type of the drawer. It determines how the drawer looks and animates.
   * - `front`: Traditional drawer which covers the screen with a overlay behind it.
   * - `back`: The drawer is revealed behind the screen on swipe.
   * - `slide`: Both the screen and the drawer slide on swipe to reveal the drawer.
   * - `permanent`: A permanent drawer is shown as a sidebar.
   *
   * Defaults to `slide` on iOS and `front` on other platforms.
   */
  drawerType?: 'front' | 'back' | 'slide' | 'permanent';

  /**
   * Whether the statusbar should be hidden when the drawer is pulled or opens,
   */
  drawerHideStatusBarOnOpen?: boolean;

  /**
   * Animation of the statusbar when hiding it. use in combination with `drawerHideStatusBarOnOpen`.
   */
  drawerStatusBarAnimation?: 'slide' | 'none' | 'fade';

  /**
   * Color of the overlay to be displayed on top of the content view when drawer gets open.
   * The opacity is animated from `0` to `1` when the drawer opens.
   */
  overlayColor?: string;

  /**
   * Accessibility label for the overlay. This is read by the screen reader when the user taps the overlay.
   * Defaults to "Close drawer".
   */
  overlayAccessibilityLabel?: string;

  /**
   * Style object for the component wrapping the screen content.
   */
  sceneStyle?: StyleProp<ViewStyle>;

  /**
   * Function to modify the pan gesture handler via RNGH properties API.
   */
  configureGestureHandler?: (gesture: PanGesture) => PanGesture;

  /**
   * Whether you can use swipe gestures to open or close the drawer.
   * Defaults to `true`.
   * Not supported on Web.
   */
  swipeEnabled?: boolean;

  /**
   * How far from the edge of the screen the swipe gesture should activate.
   * Not supported on Web.
   */
  swipeEdgeWidth?: number;

  /**
   * Minimum swipe distance threshold that should activate opening the drawer.
   */
  swipeMinDistance?: number;

  /**
   * Whether the keyboard should be dismissed when the swipe gesture begins.
   * Defaults to `'on-drag'`. Set to `'none'` to disable keyboard handling.
   */
  keyboardDismissMode?: 'on-drag' | 'none';

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
};

export type DrawerContentComponentProps = {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

export type DrawerHeaderProps = {
  /**
   * Layout of the screen.
   */
  layout: Layout;
  /**
   * Options for the current screen.
   */
  options: DrawerNavigationOptions;
  /**
   * Route object for the current screen.
   */
  route: RouteProp<ParamListBase>;
  /**
   * Navigation prop for the header.
   */
  navigation: DrawerNavigationProp<ParamListBase>;
};

export type DrawerNavigationEventMap = {
  /**
   * Event which fires on tapping on the item in the drawer menu.
   */
  drawerItemPress: { data: undefined; canPreventDefault: true };
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

export type DrawerNavigationHelpers = NavigationHelpers<
  ParamListBase,
  DrawerNavigationEventMap
> &
  DrawerActionHelpers<ParamListBase>;

export type DrawerNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  DrawerNavigationState<ParamList>,
  DrawerNavigationOptions,
  DrawerNavigationEventMap
> &
  DrawerActionHelpers<ParamList>;

export type DrawerScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = {
  navigation: DrawerNavigationProp<ParamList, RouteName, NavigatorID>;
  route: RouteProp<ParamList, RouteName>;
};

export type DrawerOptionsArgs<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = DrawerScreenProps<ParamList, RouteName, NavigatorID> & {
  theme: Theme;
};

export type DrawerDescriptor = Descriptor<
  DrawerNavigationOptions,
  DrawerNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type DrawerDescriptorMap = Record<string, DrawerDescriptor>;

export type DrawerProps = {
  dimensions: { width: number; height: number };
  drawerPosition: 'left' | 'right';
  drawerStyle?: StyleProp<ViewStyle>;
  drawerType: 'front' | 'back' | 'slide' | 'permanent';
  configureGestureHandler?: (gesture: PanGesture) => PanGesture;
  hideStatusBarOnOpen: boolean;
  keyboardDismissMode: 'none' | 'on-drag';
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
  overlayStyle?: StyleProp<ViewStyle>;
  renderDrawerContent: () => React.ReactNode;
  renderSceneContent: () => React.ReactNode;
  statusBarAnimation: 'slide' | 'none' | 'fade';
  swipeDistanceThreshold: number;
  swipeEdgeWidth: number;
  swipeEnabled: boolean;
  swipeVelocityThreshold: number;
  overlayAccessibilityLabel?: string;
};

export type DrawerNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationOptions,
  DrawerNavigationEventMap,
  DrawerNavigationProp<ParamListBase>
> &
  DrawerRouterOptions &
  DrawerNavigationConfig;
