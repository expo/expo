import type {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type HeaderBackButtonDisplayMode = 'default' | 'generic' | 'minimal';

export type Layout = { width: number; height: number };

export type HeaderSearchBarRef = {
  focus: () => void;
  blur: () => void;
  setText: (text: string) => void;
  clearText: () => void;
  cancelSearch: () => void;
};

export type HeaderSearchBarOptions = {
  /**
   * Ref to imperatively update the search bar.
   *
   * Supported operations:
   * - `focus` - focuses the search bar
   * - `blur` - removes focus from the search bar
   * - `setText` - sets the search bar's content to given value
   * - `clearText` - removes any text present in the search bar input field
   * - `cancelSearch` - cancel the search and close the search bar
   */
  ref?: React.Ref<HeaderSearchBarRef>;
  /**
   * The auto-capitalization behavior
   */
  autoCapitalize?:
    | 'none'
    | 'words'
    | 'sentences'
    | 'characters'
    | 'systemDefault';
  /**
   * Automatically focuses search input on mount
   */
  autoFocus?: boolean;
  /**
   * The text to be used instead of default `Cancel` button text
   *
   * @platform ios
   */
  cancelButtonText?: string;
  /**
   * Sets type of the input. Defaults to `text`.
   */
  inputType?: 'text' | 'phone' | 'number' | 'email';
  /**
   * Determines how the return key should look. Defaults to `search`.
   */
  enterKeyHint?: TextInputProps['enterKeyHint'];
  /**
   * A callback that gets called when search input has lost focus
   */
  onBlur?: TextInputProps['onBlur'];
  /**
   * A callback that gets called when the text changes.
   * It receives the current text value of the search input.
   */
  onChangeText?: TextInputProps['onChange'];
  /**
   * Callback that is called when the submit button is pressed.
   * It receives the current text value of the search input.
   */
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  /**
   * A callback that gets called when search input is opened
   */
  onOpen?: () => void;
  /**
   * A callback that gets called when search input is closed
   */
  onClose?: () => void;
  /**
   * A callback that gets called when search input has received focus
   */
  onFocus?: TextInputProps['onFocus'];
  /**
   * Text displayed when search field is empty
   */
  placeholder?: string;
};

export type HeaderOptions = {
  /**
   * String or a function that returns a React Element to be used by the header.
   * Defaults to screen `title` or route name.
   *
   * It receives `allowFontScaling`, `tintColor`, `style` and `children` in the options object as an argument.
   * The title string is passed in `children`.
   */
  headerTitle?: string | ((props: HeaderTitleProps) => React.ReactNode);
  /**
   * How to align the the header title.
   * Defaults to `center` on iOS and `left` on Android.
   */
  headerTitleAlign?: 'left' | 'center';
  /**
   * Style object for the title component.
   */
  headerTitleStyle?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
  /**
   * Style object for the container of the `headerTitle` element.
   */
  headerTitleContainerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Whether header title font should scale to respect Text Size accessibility settings. Defaults to `false`.
   */
  headerTitleAllowFontScaling?: boolean;
  /**
   * Options to render a search bar.
   */
  headerSearchBarOptions?: HeaderSearchBarOptions;
  /**
   * Function which returns a React Element to display on the left side of the header.
   */
  headerLeft?: (
    props: HeaderBackButtonProps & {
      /**
       * Whether it's possible to navigate back.
       */
      canGoBack?: boolean;
    }
  ) => React.ReactNode;
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
   * Style object for header back title. Supported properties:
   * - fontFamily
   * - fontSize
   */
  headerBackTitleStyle?: StyleProp<{
    fontFamily?: string;
    fontSize?: number;
  }>;
  /**
   * Style object for the container of the `headerLeft` element`.
   */
  headerLeftContainerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Function which returns a React Element to display on the right side of the header.
   */
  headerRight?: (props: {
    tintColor?: string;
    pressColor?: string;
    pressOpacity?: number;
    canGoBack: boolean;
  }) => React.ReactNode;
  /**
   * Style object for the container of the `headerRight` element.
   */
  headerRightContainerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Color for material ripple (Android >= 5.0 only).
   */
  headerPressColor?: string;
  /**
   * Color for material ripple (Android >= 5.0 only).
   */
  headerPressOpacity?: number;
  /**
   * Tint color for the header.
   */
  headerTintColor?: string;
  /**
   * Function which returns a React Element to render as the background of the header.
   * This is useful for using backgrounds such as an image, a gradient, blur effect etc.
   * You can use this with `headerTransparent` to render a blur view, for example, to create a translucent header.
   */
  headerBackground?: (props: {
    style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  }) => React.ReactNode;
  /**
   * Style object for the container of the `headerBackground` element.
   */
  headerBackgroundContainerStyle?: Animated.WithAnimatedValue<
    StyleProp<ViewStyle>
  >;
  /**
   * Defaults to `false`. If `true`, the header will not have a background unless you explicitly provide it with `headerBackground`.
   * The header will also float over the screen so that it overlaps the content underneath.
   * This is useful if you want to render a semi-transparent header or a blurred background.
   */
  headerTransparent?: boolean;
  /**
   * Style object for the header. You can specify a custom background color here, for example.
   */
  headerStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  /**
   * Whether to hide the elevation shadow (Android) or the bottom border (iOS) on the header.
   *
   * This is a short-hand for the following styles:
   *
   * ```js
   * {
   *   elevation: 0,
   *   shadowOpacity: 0,
   *   borderBottomWidth: 0,
   * }
   * ```
   *
   * If the above styles are specified in `headerStyle` along with `headerShadowVisible: false`,
   * then `headerShadowVisible: false` will take precedence.
   */
  headerShadowVisible?: boolean;
  /**
   * Extra padding to add at the top of header to account for translucent status bar.
   * By default, it uses the top value from the safe area insets of the device.
   * Pass 0 or a custom value to disable the default behaviour, and customize the height.
   */
  headerStatusBarHeight?: number;
};

export type HeaderTitleProps = {
  /**
   * The title text of the header.
   */
  children: string;
  /**
   * Whether title font should scale to respect Text Size accessibility settings.
   */
  allowFontScaling?: boolean;
  /**
   * Tint color for the header.
   */
  tintColor?: string;
  /**
   * Callback to trigger when the size of the title element changes.
   */
  onLayout?: (e: LayoutChangeEvent) => void;
  /**
   * Style object for the title element.
   */
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

export type HeaderButtonProps = {
  /**
   * Callback to call when the button is pressed.
   */
  onPress?: () => void;
  /**
   * The `href` to use for the anchor tag on web
   */
  href?: string;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
  /**
   * Accessibility label for the button for screen readers.
   */
  accessibilityLabel?: string;
  /**
   * ID to locate this button in tests.
   */
  testID?: string;
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
   * Style object for the button.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Content to render for the button. Usually the icon.
   */
  children: React.ReactNode;
};

export type HeaderBackButtonProps = Omit<HeaderButtonProps, 'children'> & {
  /**
   * Function which returns a React Element to display custom image in header's back button.
   */
  backImage?: (props: { tintColor: string }) => React.ReactNode;
  /**
   * Label text for the button. Usually the title of the previous screen.
   * By default, this is only shown on iOS.
   */
  label?: string;
  /**
   * Label text to show when there isn't enough space for the full label.
   */
  truncatedLabel?: string;
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
  displayMode?: HeaderBackButtonDisplayMode;
  /**
   * Style object for the label.
   */
  labelStyle?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  allowFontScaling?: boolean;
  /**
   * Callback to trigger when the size of the label changes.
   */
  onLabelLayout?: (e: LayoutChangeEvent) => void;
  /**
   * Layout of the screen.
   */
  screenLayout?: Layout;
  /**
   * Layout of the title element in the header.
   */
  titleLayout?: Layout;
};
