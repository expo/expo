'use client';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createContext, use, useEffect, useMemo, useState } from 'react';
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
import type { ProtectedProps } from '../views/Protected';
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
  const { configuration, setConfiguration } = contextValue;
  const setHeaderBackButtonConfiguration: StackHeaderConfigurationContextValue['setHeaderBackButtonConfiguration'] =
    (config) => {
      setConfiguration((prev) => ({ ...prev, ...config }));
    };
  const setHeaderLeftConfiguration: StackHeaderConfigurationContextValue['setHeaderLeftConfiguration'] =
    (config) => {
      setConfiguration((prev) => ({ ...prev, ...config }));
    };
  const setHeaderRightConfiguration: StackHeaderConfigurationContextValue['setHeaderRightConfiguration'] =
    (config) => {
      setConfiguration((prev) => ({ ...prev, ...config }));
    };
  const setHeaderSearchBarConfiguration: StackHeaderConfigurationContextValue['setHeaderSearchBarConfiguration'] =
    (config) => {
      setConfiguration((prev) => ({ ...prev, ...config }));
    };
  const setHeaderTitleConfiguration: StackHeaderConfigurationContextValue['setHeaderTitleConfiguration'] =
    (config) => {
      setConfiguration((prev) => ({ ...prev, ...config }));
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

  useEffect(() => {
    if (hidden) {
      setConfiguration((prev) => ({ ...prev, headerShown: false }));
    } else if (asChild) {
      setConfiguration((prev) => ({ ...prev, header: () => children }));
    } else {
      setConfiguration((prev) => ({ ...prev, ...currentConfig }));
    }
  }, [asChild, hidden, currentConfig]);

  if (asChild) {
    return null;
  }

  return (
    <StackHeaderConfigurationContext
      value={{
        configuration,
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
  useEffect(() => {
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
  useEffect(() => {
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
  useEffect(() => {
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
  useEffect(() => {
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
  useEffect(() => {
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

export function StackScreen({ name, options, children, ...rest }: StackScreenProps) {
  const contextValue = use(ScreensOptionsContext);
  const isWithinProtected = use(IsWithinProtected);
  const [configuration, setConfiguration] = useState<NativeStackNavigationOptions>({});
  if (contextValue && !name) {
    throw new Error(
      'A name prop is required for Stack.Screen when used inside of a Stack navigator.'
    );
  }
  useEffect(() => {
    if (contextValue && name) {
      contextValue.addScreenConfiguration(name, { ...options, ...configuration });
      return () => {
        contextValue.removeScreenConfiguration(name);
      };
    }
    return undefined;
  }, [name]);
  useEffect(() => {
    if (contextValue && name) {
      contextValue.setScreenProps(name, rest);
      return () => {
        contextValue.removeScreenProps(name);
      };
    }
    return undefined;
  }, [name]);
  useEffect(() => {
    if (contextValue && name && isWithinProtected) {
      contextValue.addProtectedScreen(name);
      return () => {
        contextValue.removeProtectedScreen(name);
      };
    }
    return undefined;
  }, [name, isWithinProtected]);
  useEffect(() => {
    if (contextValue && name) {
      contextValue.updateScreenConfiguration(name, { ...options, ...configuration });
    }
  }, [...Object.values(options ?? {}), configuration]);

  if (!contextValue) {
    return <Screen name={name} options={{ ...options }} />;
  }

  return (
    <ScreenOptionsContext value={{ configuration, setConfiguration }}>
      {children}
    </ScreenOptionsContext>
  );
}

const IsWithinProtected = createContext(false);

export function StackProtected({ guard, children }: ProtectedProps) {
  if (!guard) {
    return <IsWithinProtected value>{children}</IsWithinProtected>;
  }
  return <>{children}</>;
}

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  SearchBar: StackHeaderSearchBar,
});
