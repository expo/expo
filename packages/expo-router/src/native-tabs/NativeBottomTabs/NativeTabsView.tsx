import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React from 'react';
import { type ColorValue, type ImageSourcePropType, type TextStyle } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  enableFreeze,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenProps,
  type TabBarItemLabelVisibilityMode,
} from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

import { shouldTabBeVisible } from './utils';
import { getPathFromState } from '../../link/linking';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

// TODO: ENG-16896: Enable freeze globally and disable only for NativeTabsView
enableFreeze(false);

type BaseNativeTabOptions = Omit<
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
> &
  DefaultRouterOptions;

type SfSymbolOrImageSource =
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
export interface NativeTabOptions extends BaseNativeTabOptions {
  /**
   * If true, the tab will be hidden from the tab bar.
   */
  hidden?: boolean;
  /**
   * The icon to display in the tab bar.
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
   */
  selectedIcon?: SfSymbolOrImageSource;
}

export interface NativeTabsViewProps {
  style?: {
    fontFamily?: TextStyle['fontFamily'];
    fontSize?: TextStyle['fontSize'];
    fontWeight?: TextStyle['fontWeight'];
    fontStyle?: TextStyle['fontStyle'];
    color?: TextStyle['color'];
    iconColor?: ColorValue;
    backgroundColor?: ColorValue;
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
    '&:active'?: {
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
    };
  };
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

// TODO: Add support for dynamic params inside a route
export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, style, minimizeBehavior, disableIndicator } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  let focusedIndex = state.index;
  const isAnyRouteFocused =
    routes[focusedIndex].key &&
    descriptors[routes[focusedIndex].key] &&
    shouldTabBeVisible(descriptors[routes[focusedIndex].key].options);

  if (!isAnyRouteFocused) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${getPathFromState(state)}"`
      );
    }
    // Set focusedIndex to the first visible tab
    focusedIndex = routes.findIndex((route) => shouldTabBeVisible(descriptors[route.key].options));
  }

  const children = routes
    .map((route, index) => ({ route, index }))
    .filter(({ route: { key } }) => shouldTabBeVisible(descriptors[key].options))
    .map(({ route, index }) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;
      const title = descriptor.options.title ?? route.name;

      return (
        <BottomTabsScreen
          key={route.key}
          {...descriptor.options}
          iconResourceName={descriptor.options.icon?.drawable}
          icon={convertOptionsIconToPropsIcon(descriptor.options.icon)}
          selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)}
          title={title}
          tabKey={route.key}
          isFocused={isFocused}>
          {descriptor.render()}
        </BottomTabsScreen>
      );
    });

  return (
    <BottomTabs
      tabBarItemTitleFontColor={style?.color}
      tabBarItemTitleFontFamily={style?.fontFamily}
      tabBarItemTitleFontSize={style?.fontSize}
      tabBarItemTitleFontWeight={style?.fontWeight}
      tabBarItemTitleFontStyle={style?.fontStyle}
      tabBarBackgroundColor={style?.backgroundColor}
      tabBarBlurEffect={style?.blurEffect}
      tabBarTintColor={style?.tintColor}
      tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor}
      tabBarItemRippleColor={style?.rippleColor}
      tabBarItemLabelVisibilityMode={style?.labelVisibilityMode}
      tabBarItemIconColor={style?.iconColor}
      tabBarItemIconColorActive={style?.['&:active']?.iconColor ?? style?.tintColor}
      tabBarItemTitleFontColorActive={style?.['&:active']?.color ?? style?.tintColor}
      tabBarItemTitleFontSizeActive={style?.['&:active']?.fontSize}
      tabBarItemActiveIndicatorColor={style?.['&:active']?.indicatorColor}
      tabBarItemActiveIndicatorEnabled={!disableIndicator}
      tabBarMinimizeBehavior={minimizeBehavior}
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        const descriptor = descriptors[tabKey];
        const route = descriptor.route;
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: route.name,
          },
        });
      }}>
      {children}
    </BottomTabs>
  );
}

function convertOptionsIconToPropsIcon(
  icon: NativeTabOptions['icon']
): BottomTabsScreenProps['icon'] {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return { sfSymbolName: icon.sf };
  } else if ('src' in icon && icon.src) {
    return { imageSource: icon.src };
  }
  return undefined;
}
