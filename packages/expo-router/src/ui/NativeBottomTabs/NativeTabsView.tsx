import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { type ColorValue, type TextStyle } from 'react-native';
import { BottomTabs, featureFlags } from 'react-native-screens';
import type { BottomTabsScreenProps } from 'react-native-screens/lib/typescript/components/BottomTabsScreen';
import BottomTabsScreen from 'react-native-screens/src/components/BottomTabsScreen';

// import { useBottomTabAccessory } from './NativeTabsViewContext';
import { TabInfoContext } from './TabInfoContext';

const isControlledMode = Platform.OS === 'android';
featureFlags.experiment.controlledBottomTabs = isControlledMode;

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
    backgroundColor?: ColorValue;
    blurEffect?: BottomTabsScreenProps['tabBarBlurEffect'];
    tintColor?: ColorValue;
    badgeBackgroundColor?: ColorValue;
  };
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

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, style } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;
  // const { bottomTabAccessory } = useBottomTabAccessory();

  // const focusedScreenKey = state.routes[state.index].key;

  const children = routes
    .filter(({ key }) => !descriptors[key].options.hidden)
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;

      return (
        <TabInfoContext value={{ tabKey: route.key }} key={route.key}>
          <BottomTabsScreen
            {...descriptor.options}
            tabKey={route.key}
            isFocused={isFocused}
            onWillAppear={() => {
              console.log('On will appear', route.name);
              if (!isControlledMode) {
                navigation.dispatch({
                  type: 'JUMP_TO',
                  target: state.key,
                  payload: {
                    name: route.name,
                  },
                });
              }
            }}>
            {descriptor.render()}
          </BottomTabsScreen>
        </TabInfoContext>
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
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        console.log('onNativeFocusChange', tabKey);
        if (isControlledMode) {
          const descriptor = descriptors[tabKey];
          const route = descriptor.route;
          navigation.dispatch({
            type: 'JUMP_TO',
            target: state.key,
            payload: {
              name: route.name,
            },
          });
        }
        // navigation.emit({ type: 'tabPress', target: tabKey });
      }}>
      {children}
      {/* {focusedTabAccessoryProps && (
        <BottomAccessory
          {...focusedTabAccessoryProps}
          onTabAccessoryEnvironmentChange={({ nativeEvent }) => {
            console.log('onTabAccessoryEnvironmentChange', nativeEvent);
          }}
        />
      )} */}
    </BottomTabs>
  );
}
