import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, type ReactNode } from 'react';
import { StyleSheet, type ColorValue, type StyleProp } from 'react-native';
import type { ScreenStackHeaderConfigProps } from 'react-native-screens';

import {
  appendStackHeaderBackButtonPropsToOptions,
  StackHeaderBackButton,
} from './StackHeaderBackButton';
import {
  appendStackHeaderLeftPropsToOptions,
  appendStackHeaderRightPropsToOptions,
  StackHeaderLeft,
  StackHeaderRight,
} from './StackHeaderLeftRight';
import {
  appendStackHeaderSearchBarPropsToOptions,
  StackHeaderSearchBar,
} from './StackHeaderSearchBar';
import { appendStackHeaderTitlePropsToOptions, StackHeaderTitle } from './StackHeaderTitle';
import { isChildOfType } from './utils';

export interface StackHeaderProps {
  children?: ReactNode;
  hidden?: boolean;
  asChild?: boolean;
  blurEffect?: ScreenStackHeaderConfigProps['blurEffect'];
  style?: StyleProp<{
    color?: ColorValue; // tintColor from ReactNavigation
    backgroundColor?: ScreenStackHeaderConfigProps['backgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
  largeStyle?: StyleProp<{
    backgroundColor?: ScreenStackHeaderConfigProps['largeTitleBackgroundColor'];
    shadowColor?: undefined | 'transparent';
  }>;
}

export function StackHeaderComponent(props: StackHeaderProps) {
  return null;
}

export function appendStackHeaderPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderProps
): NativeStackNavigationOptions {
  const flattenedStyle = StyleSheet.flatten(props.style);
  const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);

  if (props.hidden) {
    return { ...options, headerShown: false };
  }

  if (props.asChild) {
    return { ...options, header: () => props.children };
  }

  let updatedOptions: NativeStackNavigationOptions = {
    ...options,
    headerShown: !props.hidden,
    headerBlurEffect: props.blurEffect,
    headerStyle: {
      backgroundColor: flattenedStyle?.backgroundColor as string | undefined,
    },
    headerLargeStyle: {
      backgroundColor: flattenedLargeStyle?.backgroundColor as string | undefined,
    },
    headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
    headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
  };

  function appendChildOptions(child: React.ReactElement, options: NativeStackNavigationOptions) {
    let updatedOptions = options;
    if (isChildOfType(child, StackHeaderTitle)) {
      updatedOptions = appendStackHeaderTitlePropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderLeft)) {
      updatedOptions = appendStackHeaderLeftPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderRight)) {
      updatedOptions = appendStackHeaderRightPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderBackButton)) {
      updatedOptions = appendStackHeaderBackButtonPropsToOptions(updatedOptions, child.props);
    } else if (isChildOfType(child, StackHeaderSearchBar)) {
      updatedOptions = appendStackHeaderSearchBarPropsToOptions(updatedOptions, child.props);
    } else {
      console.warn(
        `Warning: Unknown child element passed to Stack.Header: ${(child.type as { name: string }).name ?? child.type}`
      );
    }
    return updatedOptions;
  }

  Children.forEach(props.children, (child) => {
    if (isValidElement(child)) {
      updatedOptions = appendChildOptions(child, updatedOptions);
    }
  });

  return updatedOptions;
}
