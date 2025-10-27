'use client';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createContext, use, useCallback, useLayoutEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type {
  StackHeaderBackButtonProps,
  StackHeaderLeftProps,
  StackHeaderProps,
  StackHeaderRightProps,
  StackHeaderTitleProps,
  StackHeaderSearchBarProps,
  StackHeaderConfigurationContextValue,
  StackScreensConfigurationContextValue,
  StackScreenConfigurationContextValue,
  StackScreenProps,
} from './StackElements.types';
import { useNavigation } from '../useNavigation';
import { Screen } from '../views/Screen';

export const StackHeaderConfigurationContext = createContext<
  StackHeaderConfigurationContextValue | undefined
>(undefined);

function StackHeaderComponent({
  asChild,
  children,
  hidden,
  blurEffect,
  style,
  largeStyle,
}: StackHeaderProps) {
  const contextValue = use(ScreenOptionsContext);
  if (!contextValue) {
    throw new Error(
      'Stack.Header can only be used inside of a Stack.Screen component in a _layout file.'
    );
  }
  const { setConfiguration } = contextValue;
  const setHeaderBackButtonConfiguration: StackHeaderConfigurationContextValue['setHeaderBackButtonConfiguration'] =
    (config) => {
      setConfiguration({ ...config });
    };
  const setHeaderLeftConfiguration: StackHeaderConfigurationContextValue['setHeaderLeftConfiguration'] =
    (config) => {
      setConfiguration({ ...config });
    };
  const setHeaderRightConfiguration: StackHeaderConfigurationContextValue['setHeaderRightConfiguration'] =
    (config) => {
      setConfiguration({ ...config });
    };
  const setHeaderSearchBarConfiguration: StackHeaderConfigurationContextValue['setHeaderSearchBarConfiguration'] =
    (config) => {
      setConfiguration({ ...config });
    };
  const setHeaderTitleConfiguration: StackHeaderConfigurationContextValue['setHeaderTitleConfiguration'] =
    (config) => {
      setConfiguration({ ...config });
    };

  const currentConfig = useMemo<NativeStackNavigationOptions>(() => {
    const flattenedStyle = StyleSheet.flatten(style);
    const flattenedLargeStyle = StyleSheet.flatten(largeStyle);
    return {
      headerShown: !hidden,
      headerBlurEffect: blurEffect,
      headerStyle: {
        backgroundColor: flattenedStyle?.backgroundColor as string | undefined,
      },
      headerLargeStyle: {
        backgroundColor: flattenedLargeStyle?.backgroundColor as string | undefined,
      },
      headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
      headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
    };
  }, [hidden, blurEffect, style, largeStyle]);

  useLayoutEffect(() => {
    if (hidden) {
      setConfiguration({ headerShown: false });
    } else if (asChild) {
      setConfiguration({ header: () => children });
    } else {
      setConfiguration({ ...currentConfig });
    }
  }, [asChild, hidden, currentConfig]);

  if (asChild) {
    return null;
  }

  return (
    <StackHeaderConfigurationContext
      value={{
        setHeaderBackButtonConfiguration,
        setHeaderLeftConfiguration,
        setHeaderRightConfiguration,
        setHeaderSearchBarConfiguration,
        setHeaderTitleConfiguration,
      }}>
      {children}
    </StackHeaderConfigurationContext>
  );
}

function StackHeaderLeft({ asChild, children }: StackHeaderLeftProps) {
  const contextValue = use(StackHeaderConfigurationContext);
  if (!contextValue) {
    throw new Error(
      'Stack.Header.Left can only be used inside of a Stack.Header component in a _layout file.'
    );
  }
  const { setHeaderLeftConfiguration } = contextValue;
  useLayoutEffect(() => {
    const config = asChild ? { headerLeft: () => children } : {};
    setHeaderLeftConfiguration(config);
  }, [children, asChild]);
  return null;
}

function StackHeaderRight({ asChild, children }: StackHeaderRightProps) {
  const contextValue = use(StackHeaderConfigurationContext);
  if (!contextValue) {
    throw new Error(
      'Stack.Header.Right can only be used inside of a Stack.Header component in a _layout file.'
    );
  }
  const { setHeaderRightConfiguration } = contextValue;
  useLayoutEffect(() => {
    const config = asChild ? { headerRight: () => children } : {};
    setHeaderRightConfiguration(config);
  }, [children, asChild]);
  return null;
}

function StackHeaderBackButton({
  children,
  style,
  withMenu,
  displayMode,
  src,
  hidden,
}: StackHeaderBackButtonProps) {
  const contextValue = use(StackHeaderConfigurationContext);
  if (!contextValue) {
    throw new Error(
      'Stack.Header.BackButton can only be used inside of a Stack.Header component in a _layout file.'
    );
  }
  const { setHeaderBackButtonConfiguration } = contextValue;
  useLayoutEffect(() => {
    setHeaderBackButtonConfiguration({
      headerBackTitle: children,
      headerBackTitleStyle: style,
      headerBackImageSource: src,
      headerBackButtonDisplayMode: displayMode,
      headerBackButtonMenuEnabled: withMenu,
      headerBackVisible: !hidden,
    });
  }, []);
  return null;
}

function StackHeaderTitle({ children, style, large, largeStyle }: StackHeaderTitleProps) {
  const contextValue = use(StackHeaderConfigurationContext);
  if (!contextValue) {
    throw new Error(
      'Stack.Header.Title can only be used inside of a Stack.Header component in a _layout file.'
    );
  }
  const { setHeaderTitleConfiguration } = contextValue;
  useLayoutEffect(() => {
    const flattenedStyle = StyleSheet.flatten(style);
    const flattenedLargeStyle = StyleSheet.flatten(largeStyle);
    setHeaderTitleConfiguration({
      headerTitle: children,
      headerLargeTitle: large,
      headerTitleAlign: flattenedStyle?.textAlign,
      headerTitleStyle: {
        ...flattenedStyle,
        // This is needed because React Navigation expects color to be a string
        color: (flattenedStyle?.color as string) ?? undefined,
      },
      headerLargeTitleStyle: {
        ...flattenedLargeStyle,
        fontWeight: flattenedLargeStyle?.fontWeight?.toString(),
        // This is needed because React Navigation expects color to be a string
        color: (flattenedLargeStyle?.color as string) ?? undefined,
      },
    });
  }, [children, style, large, largeStyle]);
  return null;
}

function StackHeaderSearchBar(props: StackHeaderSearchBarProps) {
  const contextValue = use(StackHeaderConfigurationContext);
  useLayoutEffect(() => {
    if (!contextValue) {
      throw new Error(
        'Stack.Header.SearchBar can only be used inside of a Stack.Header component in a _layout file.'
      );
    }
    const { setHeaderSearchBarConfiguration } = contextValue;
    setHeaderSearchBarConfiguration({
      headerSearchBarOptions: props,
    });
  }, [props]);
  return null;
}

export const ScreensOptionsContext = createContext<
  StackScreensConfigurationContextValue | undefined
>(undefined);

export const ScreenOptionsContext = createContext<StackScreenConfigurationContextValue | undefined>(
  undefined
);

export const IsWithinCompositionConfiguration = createContext<boolean>(false);

export function StackScreen({ children, ...rest }: StackScreenProps) {
  if (use(IsWithinCompositionConfiguration)) {
    return <StackScreenInner {...rest} children={children} />;
  } else {
    return <Screen {...rest} />;
  }
}

function StackScreenInner({ name, options, children, ...rest }: StackScreenProps) {
  const navigation = useNavigation();

  const setConfiguration = useCallback<StackScreenConfigurationContextValue['setConfiguration']>(
    (configUpdater) => {
      navigation.setOptions(configUpdater);
    },
    [navigation]
  );

  return <ScreenOptionsContext value={{ setConfiguration }}>{children}</ScreenOptionsContext>;
}

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  SearchBar: StackHeaderSearchBar,
});
