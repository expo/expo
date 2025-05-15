import {
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { Children, PropsWithChildren, useState } from 'react';
import { View, Text, StyleSheet, type ColorValue, type ViewProps, Pressable } from 'react-native';
import { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import { RNSNativeTabsScreen } from './NativeBottomTabsScreen';

// TODO: Report issue on RN repo, that nesting color value inside a struct does not work.
// Generated code is ok, but the value is not passed down correctly - whatever color is set
// host component receives RGBA(0, 0, 0, 0) anyway.
type TabBarAppearance = Readonly<{
  backgroundColor?: ColorValue;
}>;

type BlurEffect =
  | 'none'
  | 'extraLight'
  | 'light'
  | 'dark'
  | 'regular'
  | 'prominent'
  | 'systemUltraThinMaterial'
  | 'systemThinMaterial'
  | 'systemMaterial'
  | 'systemThickMaterial'
  | 'systemChromeMaterial'
  | 'systemUltraThinMaterialLight'
  | 'systemThinMaterialLight'
  | 'systemMaterialLight'
  | 'systemThickMaterialLight'
  | 'systemChromeMaterialLight'
  | 'systemUltraThinMaterialDark'
  | 'systemThinMaterialDark'
  | 'systemMaterialDark'
  | 'systemThickMaterialDark'
  | 'systemChromeMaterialDark';

export interface NativeProps extends ViewProps {
  tabBarAppearance?: TabBarAppearance;
  tabBarBackgroundColor?: ColorValue;
  tabBarBlurEffect?: WithDefault<BlurEffect, 'none'>;
}

export type NativeTabsViewProps = {
  builder: ReturnType<
    typeof useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      Record<string, (...args: any) => void>,
      {},
      Record<string, any>
    >
  >;
};

export function NativeTabsView(props: PropsWithChildren<NativeTabsViewProps>) {
  const { state, descriptors } = props.builder;
  const { routes } = state;

  const children = routes.map((route, index) => {
    const descriptor = descriptors[route.key];
    const isFocused = state.index === index;
    return <RNSNativeTabsScreen isFocused={isFocused}>{descriptor.render()}</RNSNativeTabsScreen>;
  });

  return <RNSNativeTabs>{children}</RNSNativeTabs>;
}

function RNSNativeTabs(props: NativeProps) {
  const [lastFocus, setLastFocus] = useState<number>(0);
  const [currentFocus, setCurrentFocus] = useState<number>(lastFocus);

  const propFocus = Children.map(props.children, (child) => {
    if (
      !child ||
      typeof child !== 'object' ||
      !('props' in child) ||
      typeof child.props !== 'object' ||
      !child.props
    ) {
      return null;
    }

    return (child.props as Record<string, any>).isFocused;
  })?.findIndex((child) => child === true);

  if (propFocus !== undefined && propFocus !== lastFocus) {
    setLastFocus(propFocus);
    setCurrentFocus(propFocus);
  }

  return (
    <View style={styles.root}>
      {Children.map(props.children, (child, index) => {
        if (
          !child ||
          typeof child !== 'object' ||
          !('props' in child) ||
          typeof child.props !== 'object' ||
          !child.props
        ) {
          return null;
        }

        const screen = index !== currentFocus ? null : child;

        return (
          <>
            <View>{screen}</View>
            <Pressable
              onPress={() => {
                setCurrentFocus(index);
              }}
              style={{
                backgroundColor: props.tabBarAppearance?.backgroundColor,
              }}>
              <Text>{(child.props as Record<string, any>).badgeValue}</Text>
            </Pressable>
          </>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
