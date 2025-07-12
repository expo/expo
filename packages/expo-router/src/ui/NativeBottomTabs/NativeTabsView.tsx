import {
  DefaultRouterOptions,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { BottomTabs, enableFreeze, featureFlags } from 'react-native-screens';
import { BottomTabsProps } from 'react-native-screens/lib/typescript/components/BottomTabs';
import type { BottomTabsScreenProps } from 'react-native-screens/lib/typescript/components/BottomTabsScreen';
import BottomTabsScreen from 'react-native-screens/src/components/BottomTabsScreen';

// import { useBottomTabAccessory } from './NativeTabsViewContext';
import { TabInfoContext } from './TabInfoContext';

enableFreeze(false);
const isControlledMode = Platform.OS === 'android';
featureFlags.experiment.controlledBottomTabs = isControlledMode;

export interface NativeTabOptions extends DefaultRouterOptions {
  tabBarBackgroundColor?: BottomTabsScreenProps['tabBarBackgroundColor'];
  tabBarBlurEffect?: BottomTabsScreenProps['tabBarBlurEffect']; // defaults to 'none'

  tabBarItemTitleFontFamily?: BottomTabsScreenProps['tabBarItemTitleFontFamily'];
  tabBarItemTitleFontSize?: BottomTabsScreenProps['tabBarItemTitleFontSize'];
  tabBarItemTitleFontWeight?: BottomTabsScreenProps['tabBarItemTitleFontWeight'];
  tabBarItemTitleFontStyle?: BottomTabsScreenProps['tabBarItemTitleFontStyle'];
  tabBarItemTitleFontColor?: BottomTabsScreenProps['tabBarItemTitleFontColor'];
  tabBarItemTitlePositionAdjustment?: BottomTabsScreenProps['tabBarItemTitlePositionAdjustment'];

  tabBarItemIconColor?: BottomTabsScreenProps['tabBarItemIconColor'];

  tabBarItemBadgeBackgroundColor?: BottomTabsScreenProps['tabBarItemBadgeBackgroundColor'];

  // General
  title?: BottomTabsScreenProps['title'];

  iconSFSymbolName?: BottomTabsScreenProps['iconSFSymbolName'];
  selectedIconSFSymbolName?: BottomTabsScreenProps['selectedIconSFSymbolName'];

  badgeValue?: BottomTabsScreenProps['badgeValue'];
}

export type NativeTabsViewProps = Omit<BottomTabsProps, 'onNativeFocusChange'> & {
  builder: ReturnType<
    typeof useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      Record<string, (...args: any) => void>,
      NativeTabOptions,
      Record<string, any>
    >
  >;
};

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, ...rest } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;
  // const { bottomTabAccessory } = useBottomTabAccessory();

  // const focusedScreenKey = state.routes[state.index].key;

  const children = routes
    .filter(({ key }) => (descriptors[key].options as any)?.tabBarItemStyle?.display !== 'none')
    .map((route, index) => {
      const descriptor = descriptors[route.key];
      const isFocused = state.index === index;
      console.log('Rendering tab', route.key, 'isFocused:', isFocused);

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
  // const focusedTabAccessoryProps = bottomTabAccessory[focusedScreenKey];
  // console.log('\n\n\n\n\naccessory', focusedTabAccessoryProps, bottomTabAccessory);

  return (
    <BottomTabs
      {...rest}
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
        navigation.emit({ type: 'tabPress', target: tabKey });
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
