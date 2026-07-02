'use client';
import * as React from 'react';
import { use } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

import {
  getHeaderTitle,
  Header,
  HeaderBackButton,
  HeaderBackContext,
  SafeAreaProviderCompat,
  Screen,
  useHeaderHeight,
} from '../../elements';
import { type ParamListBase, type StackNavigationState, useLinkBuilder } from '../../native';
import type { NativeStackDescriptorMap, NativeStackNavigationHelpers } from '../types';
import { AnimatedHeaderHeightContext } from '../utils/useAnimatedHeaderHeight';

type Props = {
  state: StackNavigationState<ParamListBase>;
  // This is used for the native implementation of the stack.
  navigation: NativeStackNavigationHelpers;
  descriptors: NativeStackDescriptorMap;
};

const TRANSPARENT_PRESENTATIONS = ['transparentModal', 'containedTransparentModal'];

export function NativeStackView({ state, descriptors }: Props) {
  const parentHeaderBack = use(HeaderBackContext);
  const { buildHref } = useLinkBuilder();

  return (
    <SafeAreaProviderCompat>
      {state.routes.map((route, i) => {
        const isFocused = state.index === i;
        // Routes after `index` are preloaded/inactive (drives display/freeze below).
        const isPreloaded = i > state.index;
        const previousKey = state.routes[i - 1]?.key;
        const nextKey = state.routes[i + 1]?.key;
        const previousDescriptor = previousKey ? descriptors[previousKey] : undefined;
        const nextDescriptor = nextKey ? descriptors[nextKey] : undefined;
        const { options, navigation, render } = descriptors[route.key]!;

        const headerBack = previousDescriptor
          ? {
              title: getHeaderTitle(previousDescriptor.options, previousDescriptor.route.name),
              href: buildHref(previousDescriptor.route.name, previousDescriptor.route.params),
            }
          : parentHeaderBack;

        const canGoBack = headerBack != null;

        const {
          header,
          headerShown,
          headerBackIcon,
          headerBackImageSource,
          headerLeft,
          headerTransparent,
          headerBackTitle,
          presentation,
          contentStyle,
          ...rest
        } = options;

        const nextPresentation = nextDescriptor?.options.presentation;

        return (
          <Screen
            key={route.key}
            focused={isFocused}
            route={route}
            navigation={navigation}
            headerShown={headerShown}
            headerTransparent={headerTransparent}
            header={
              header !== undefined ? (
                header({
                  back: headerBack,
                  options,
                  route,
                  navigation,
                })
              ) : (
                <Header
                  {...rest}
                  back={headerBack}
                  title={getHeaderTitle(options, route.name)}
                  headerLeft={
                    typeof headerLeft === 'function'
                      ? ({ label, ...rest }) =>
                          headerLeft({
                            ...rest,
                            label: headerBackTitle ?? label,
                          })
                      : headerLeft === undefined && canGoBack
                        ? ({ tintColor, label, ...rest }) => (
                            <HeaderBackButton
                              {...rest}
                              label={headerBackTitle ?? label}
                              tintColor={tintColor}
                              backImage={
                                headerBackIcon !== undefined || headerBackImageSource !== undefined
                                  ? () => (
                                      <Image
                                        source={headerBackIcon?.source ?? headerBackImageSource}
                                        resizeMode="contain"
                                        tintColor={tintColor}
                                        style={styles.backImage}
                                      />
                                    )
                                  : undefined
                              }
                              onPress={navigation.goBack}
                            />
                          )
                        : headerLeft
                  }
                  headerTransparent={headerTransparent}
                />
              )
            }
            style={[
              StyleSheet.absoluteFill,
              {
                display:
                  (isFocused ||
                    (nextPresentation != null &&
                      TRANSPARENT_PRESENTATIONS.includes(nextPresentation))) &&
                  !isPreloaded
                    ? 'flex'
                    : 'none',
              },
              presentation != null && TRANSPARENT_PRESENTATIONS.includes(presentation)
                ? { backgroundColor: 'transparent' }
                : null,
            ]}>
            <HeaderBackContext.Provider value={headerBack}>
              <AnimatedHeaderHeightProvider>
                <View style={[styles.contentContainer, contentStyle]}>{render()}</View>
              </AnimatedHeaderHeightProvider>
            </HeaderBackContext.Provider>
          </Screen>
        );
      })}
    </SafeAreaProviderCompat>
  );
}

const AnimatedHeaderHeightProvider = ({ children }: { children: React.ReactNode }) => {
  const headerHeight = useHeaderHeight();
  const [animatedHeaderHeight] = React.useState(() => new Animated.Value(headerHeight));

  React.useEffect(() => {
    animatedHeaderHeight.setValue(headerHeight);
  }, [animatedHeaderHeight, headerHeight]);

  return (
    <AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
      {children}
    </AnimatedHeaderHeightContext.Provider>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  backImage: {
    height: 24,
    width: 24,
    margin: 3,
  },
});
