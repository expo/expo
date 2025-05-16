import React, { Children, useState } from 'react';
import { View, Text, StyleSheet, type ColorValue, type ViewProps, Pressable } from 'react-native';
import { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

import { RNSNativeTabsScreen, RNSNativeTabsScreenProps } from './RNSNativeTabsScreen';

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

export function RNSNativeTabs(props: NativeProps) {
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
    <View style={styles.root} testID="native-tabs-root">
      {Children.map(props.children, (child, index) => {
        if (React.isValidElement(child) && !child.props) {
          return null;
        }

        if (index !== currentFocus) {
          return null;
        }

        return (
          <>
            <View style={{ flex: 1 }}>{child}</View>
          </>
        );
      })}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          padding: 10,
          backgroundColor: props.tabBarAppearance?.backgroundColor,
        }}>
        {Children.map(props.children, (child, index) => {
          if (!React.isValidElement(child) || child?.type !== RNSNativeTabsScreen) {
            return null;
          }
          return (
            <Pressable
              onPress={() => {
                setCurrentFocus(index);
              }}
              style={{
                borderColor: 'black',
                borderWidth: 1,
                padding: 10,
              }}>
              <Text>{(child.props as RNSNativeTabsScreenProps | undefined)?.badgeValue ?? ''}</Text>
            </Pressable>
          );
        })}
      </View>
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
