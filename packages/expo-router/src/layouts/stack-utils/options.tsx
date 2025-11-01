import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, Fragment, isValidElement, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import {
  StackHeaderTitle,
  StackHeaderBackButton,
  StackHeaderComponent,
  StackHeaderLeft,
  StackHeaderRight,
  StackHeaderSearchBar,
} from './elements';
import type {
  StackHeaderBackButtonProps,
  StackHeaderLeftProps,
  StackHeaderProps,
  StackHeaderRightProps,
  StackHeaderTitleProps,
  StackHeaderSearchBarProps,
  StackScreenProps,
} from './types';

export function appendScreenStackPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenProps
): NativeStackNavigationOptions {
  let updatedOptions = { ...options, ...props.options };
  function appendChildOptions(child: React.ReactElement, options: NativeStackNavigationOptions) {
    if (child.type === StackHeaderComponent) {
      updatedOptions = appendStackHeaderPropsToOptions(options, child.props as StackHeaderProps);
    } else {
      updatedOptions = processUnknownChild(options, child, appendChildOptions);
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

function appendStackHeaderPropsToOptions(
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
    if (child.type === StackHeaderTitle) {
      updatedOptions = appendStackHeaderTitlePropsToOptions(
        updatedOptions,
        child.props as StackHeaderTitleProps
      );
    } else if (child.type === StackHeaderLeft) {
      updatedOptions = appendStackHeaderLeftPropsToOptions(
        updatedOptions,
        child.props as StackHeaderLeftProps
      );
    } else if (child.type === StackHeaderRight) {
      updatedOptions = appendStackHeaderRightPropsToOptions(
        updatedOptions,
        child.props as StackHeaderRightProps
      );
    } else if (child.type === StackHeaderBackButton) {
      updatedOptions = appendStackHeaderBackButtonPropsToOptions(
        updatedOptions,
        child.props as StackHeaderBackButtonProps
      );
    } else if (child.type === StackHeaderSearchBar) {
      updatedOptions = appendStackHeaderSearchBarPropsToOptions(
        updatedOptions,
        child.props as StackHeaderSearchBarProps
      );
    } else {
      updatedOptions = processUnknownChild(updatedOptions, child, appendChildOptions);
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

function appendStackHeaderLeftPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderLeftProps
): NativeStackNavigationOptions {
  if (!props.asChild) {
    return options;
  }

  return {
    ...options,
    headerLeft: () => props.children,
  };
}

function appendStackHeaderRightPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderRightProps
): NativeStackNavigationOptions {
  if (!props.asChild) {
    return options;
  }

  return {
    ...options,
    headerRight: () => props.children,
  };
}

function appendStackHeaderTitlePropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderTitleProps
): NativeStackNavigationOptions {
  const flattenedStyle = StyleSheet.flatten(props.style);
  const flattenedLargeStyle = StyleSheet.flatten(props.largeStyle);

  return {
    ...options,
    headerTitle: props.children,
    headerLargeTitle: props.large,
    headerTitleAlign: flattenedStyle?.textAlign,
    headerTitleStyle: {
      ...flattenedStyle,
      color: (flattenedStyle?.color as string) ?? undefined,
    },
    headerLargeTitleStyle: {
      ...flattenedLargeStyle,
      fontWeight: flattenedLargeStyle?.fontWeight?.toString(),
      color: (flattenedLargeStyle?.color as string) ?? undefined,
    },
  };
}

function appendStackHeaderBackButtonPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderBackButtonProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerBackTitle: props.children,
    headerBackTitleStyle: props.style,
    headerBackImageSource: props.src,
    headerBackButtonDisplayMode: props.displayMode,
    headerBackButtonMenuEnabled: props.withMenu,
    headerBackVisible: !props.hidden,
  };
}

function appendStackHeaderSearchBarPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderSearchBarProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerSearchBarOptions: {
      ...props,
    },
  };
}

function processUnknownChild<PropsT>(
  options: NativeStackNavigationOptions,
  child: React.ReactElement,
  appendChildOptions: (
    child: React.ReactElement,
    options: NativeStackNavigationOptions
  ) => NativeStackNavigationOptions
) {
  if (isChildOfType(child, Fragment)) {
    Children.forEach(child.props.children, (grandChild) => {
      if (isValidElement(grandChild)) {
        options = appendChildOptions(grandChild, options);
      }
    });
  } else if (typeof child.type === 'function') {
    // Handle function components (not class components)
    const type = child.type as any;
    const isClassComponent = !!type.prototype?.isReactComponent;

    if (!isClassComponent) {
      try {
        const renderedChildren = type(child.props);
        Children.forEach(renderedChildren, (grandChild) => {
          if (isValidElement(grandChild)) {
            options = appendChildOptions(grandChild, options);
          }
        });
      } catch (e) {
        if (e instanceof Error && e.message.includes('React is not defined')) {
          throw new Error(
            'Using hooks inside custom header components is not supported. Please avoid using hooks in components passed to Stack.Header.'
          );
        } else {
          throw e;
        }
      }
    }
  }
  return options;
}

export function isChildOfType<PropsT>(
  element: React.ReactNode,
  type: (props: PropsT) => unknown
): element is ReactElement<PropsT> {
  return isValidElement(element) && element.type === type;
}
