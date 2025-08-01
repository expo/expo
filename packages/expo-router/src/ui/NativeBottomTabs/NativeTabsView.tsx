import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React from 'react';
import { type ColorValue, type TextStyle } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  enableFreeze,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenProps,
  type TabBarItemLabelVisibilityMode,
} from 'react-native-screens';

import { shouldTabBeVisible } from './utils';
import { getPathFromState } from '../../link/linking';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

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
> &
  DefaultRouterOptions & { hidden?: boolean };

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
   *
   * @platform iOS 26
   */
  minimizeBehavior?: BottomTabsProps['tabBarMinimizeBehavior'];
  /**
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

enableFreeze(false);

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

      return (
        <BottomTabsScreen
          key={route.key}
          {...descriptor.options}
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
