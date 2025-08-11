import type {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import type { ColorValue, ImageSourcePropType, TextStyle } from 'react-native';
import type {
  BottomTabsProps,
  BottomTabsScreenProps,
  TabBarItemLabelVisibilityMode,
} from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

export type NativeTabOptions = Omit<
  BottomTabsScreenProps,
  | 'children'
  | 'placeholder'
  | 'onWillAppear'
  | 'onDidAppear'
  | 'onWillDisappear'
  | 'onDidDisappear'
  | 'isFocused'
  | 'tabKey'
  | 'icon'
  | 'selectedIcon'
  | 'iconResourceName'
  | 'specialEffects'
> &
  DefaultRouterOptions & {
    /**
     * The icon to display in the tab bar.
     * @platform android
     * @platform iOS
     */
    icon?: SfSymbolOrImageSource & {
      /**
       * The name of the drawable resource to use as an icon.
       * @platform android
       */
      drawable?: string;
    };
    /**
     * The icon to display when the tab is selected.
     * @platform iOS
     */
    selectedIcon?: SfSymbolOrImageSource;
  };

export type SfSymbolOrImageSource =
  | {
      /**
       * The name of the SF Symbol to use as an icon.
       * @platform iOS
       */
      sf?: SFSymbol;
    }
  | {
      /**
       * The image source to use as an icon.
       * @platform iOS
       */
      src?: ImageSourcePropType;
    };

export interface ExtendedNativeTabOptions extends NativeTabOptions {
  /**
   * If true, the tab will be hidden from the tab bar.
   */
  hidden?: boolean;
  specialEffects?: BottomTabsScreenProps['specialEffects'];
}

export interface NativeTabsStyleType {
  fontFamily?: TextStyle['fontFamily'];
  fontSize?: TextStyle['fontSize'];
  fontWeight?: TextStyle['fontWeight'];
  fontStyle?: TextStyle['fontStyle'];
  color?: TextStyle['color'];
  /**
   * @platform android
   * @platform iOS
   */
  iconColor?: ColorValue;
  backgroundColor?: ColorValue;
  /**
   * @platform iOS
   */
  blurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
  tintColor?: ColorValue;
  badgeBackgroundColor?: ColorValue;
  /**
   * @platform android
   */
  rippleColor?: ColorValue;
  /**
   * @platform android
   */
  labelVisibilityMode?: TabBarItemLabelVisibilityMode;
  /**
   * @platform android
   */
  '&:active'?: NativeTabsActiveStyleType;
}

export interface NativeTabsActiveStyleType {
  /**
   * @platform android
   */
  color?: ColorValue;
  /**
   * @platform android
   */
  fontSize?: TextStyle['fontSize'];
  /**
   * @platform android
   */
  iconColor?: ColorValue;
  /**
   * @platform android
   */
  indicatorColor?: ColorValue;
}

export interface NativeTabsProps extends PropsWithChildren {
  style?: NativeTabsStyleType;
  /**
   * https://developer.apple.com/documentation/uikit/uitabbarcontroller/tabbarminimizebehavior
   *
   * Supported values:
   * - `none` - The tab bar does not minimize.
   * - `onScrollUp` - The tab bar minimizes when scrolling up, and expands when scrolling back down. Recommended if the scroll view content is aligned to the bottom.
   * - `onScrollDown` - The tab bar minimizes when scrolling down, and expands when scrolling back up.
   * - `automatic` - Resolves to the system default minimize behavior.
   *
   * @default automatic
   *
   * @platform iOS 26
   */
  minimizeBehavior?: BottomTabsProps['tabBarMinimizeBehavior'];
  /**
   * Disables the active indicator for the tab bar.
   *
   * @platform android
   */
  disableIndicator?: boolean;
  /**
   * The behavior when navigating back with the back button.
   *
   * @platform android
   */
  backBehavior?: 'none' | 'initialRoute' | 'history';
}

export interface NativeTabsViewProps extends NativeTabsProps {
  builder: ReturnType<
    typeof useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      Record<string, (...args: any) => void>,
      NativeTabOptions,
      Record<string, any>
    >
  >;
}

export interface NativeTabTriggerProps {
  /**
   * The name of the route.
   *
   * This is required when used inside a Layout component.
   *
   * When used in a route it has no effect.
   */
  name?: string;
  /**
   * If true, the tab will be hidden from the tab bar.
   */
  hidden?: boolean;
  /**
   * The options for the trigger.
   *
   * Use `Icon`, `Label`, and `Badge` components as children to customize the tab, rather then raw options.
   */
  options?: NativeTabOptions;
  /**
   * If true, the tab will not pop stack to the root when selected again.
   * @default false
   *
   * @platform ios
   */
  disablePopToTop?: boolean;
  /**
   * If true, the tab will not scroll to the top when selected again.
   * @default false
   *
   * @platform ios
   */
  disableScrollToTop?: boolean;
  /**
   * The children of the trigger.
   *
   * Use `Icon`, `Label`, and `Badge` components to customize the tab.
   */
  children?: React.ReactNode;
}
