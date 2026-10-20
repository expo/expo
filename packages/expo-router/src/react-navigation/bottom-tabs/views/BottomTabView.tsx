'use client';
import * as React from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { getHeaderTitle, Header, SafeAreaProviderCompat, Screen } from '../../elements';
import {
  type NavigationAction,
  type ParamListBase,
  StackActions,
  type TabNavigationState,
} from '../../native';
import { FadeTransition, ShiftTransition } from '../TransitionConfigs/TransitionPresets';
import type {
  BottomTabBarProps,
  BottomTabDescriptorMap,
  BottomTabHeaderProps,
  BottomTabNavigationConfig,
  BottomTabNavigationHelpers,
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
} from '../types';
import { BottomTabBar, getTabBarHeight } from './BottomTabBar';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';
import { BottomTabBarHeightCallbackContext } from '../utils/BottomTabBarHeightCallbackContext';
import { BottomTabBarHeightContext } from '../utils/BottomTabBarHeightContext';
import { useAnimatedHashMap } from '../utils/useAnimatedHashMap';

type Props = BottomTabNavigationConfig & {
  state: TabNavigationState<ParamListBase>;
  navigation: BottomTabNavigationHelpers;
  descriptors: BottomTabDescriptorMap;
};

const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;

const NAMED_TRANSITIONS_PRESETS = {
  fade: FadeTransition,
  shift: ShiftTransition,
  none: {
    sceneStyleInterpolator: undefined,
    transitionSpec: {
      animation: 'timing',
      config: { duration: 0 },
    },
  },
} as const;

const useNativeDriver = Platform.OS !== 'web';

const hasAnimation = (options: BottomTabNavigationOptions) => {
  const { animation, transitionSpec } = options;

  if (animation) {
    return animation !== 'none';
  }

  return Boolean(transitionSpec);
};

const renderTabBarDefault = (props: BottomTabBarProps) => <BottomTabBar {...props} />;

export function BottomTabView(props: Props) {
  const {
    tabBar = renderTabBarDefault,
    state,
    navigation,
    descriptors,
    safeAreaInsets,
    detachInactiveScreens = Platform.OS === 'web' ||
      Platform.OS === 'android' ||
      Platform.OS === 'ios',
  } = props;

  const focusedRouteKey = state.routes[state.index]!.key;

  /**
   * List of loaded tabs, tabs will be loaded when navigated to.
   */
  const [loaded, setLoaded] = React.useState([focusedRouteKey]);

  if (!loaded.includes(focusedRouteKey)) {
    // Set the current tab to be loaded if it was not loaded before
    setLoaded([...loaded, focusedRouteKey]);
  }

  const previousRouteKeyRef = React.useRef(focusedRouteKey);
  const tabAnims = useAnimatedHashMap(state);

  const [lastUpdate, setLastUpdate] = React.useState<{
    current: string;
    previous?: string;
    animating: boolean;
  }>({
    current: focusedRouteKey,
    animating: false,
  });

  if (lastUpdate.current !== focusedRouteKey) {
    setLastUpdate({
      current: focusedRouteKey,
      previous: lastUpdate.current,
      animating: true,
    });
  }

  React.useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;

    let popToTopAction: NavigationAction | undefined;

    if (
      previousRouteKey !== focusedRouteKey &&
      descriptors[previousRouteKey]?.options.popToTopOnBlur
    ) {
      const prevRoute = state.routes.find((route) => route.key === previousRouteKey);

      if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
        popToTopAction = {
          ...StackActions.popToTop(),
          target: prevRoute.state.key,
        };
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const animateToIndex = () => {
      if (previousRouteKey !== focusedRouteKey) {
        navigation.emit({
          type: 'transitionStart',
          target: focusedRouteKey,
        });
      }

      Animated.parallel(
        state.routes
          .map((route, index) => {
            const { options } = descriptors[route.key]!;
            const {
              animation = 'none',
              transitionSpec = NAMED_TRANSITIONS_PRESETS[animation]!.transitionSpec,
            } = options;

            let spec = transitionSpec;

            if (route.key !== previousRouteKey && route.key !== focusedRouteKey) {
              // Don't animate if the screen is not previous one or new one
              // This will avoid flicker for screens not involved in the transition
              spec = NAMED_TRANSITIONS_PRESETS.none.transitionSpec;
            }

            spec = spec ?? NAMED_TRANSITIONS_PRESETS.none.transitionSpec;

            const toValue = index === state.index ? 0 : index >= state.index ? 1 : -1;

            return Animated[spec.animation](tabAnims[route.key]!, {
              ...spec.config,
              toValue,
              useNativeDriver,
            });
          })
          .filter(Boolean) as Animated.CompositeAnimation[]
      ).start(({ finished }) => {
        if (finished && popToTopAction) {
          navigation.dispatch(popToTopAction);
        }

        if (previousRouteKey !== focusedRouteKey) {
          navigation.emit({
            type: 'transitionEnd',
            target: focusedRouteKey,
          });
        }

        if (finished) {
          // Delay clearing so the previous screen stays attached
          // This will give time for any native logic to run
          timer = setTimeout(() => {
            setLastUpdate((update) =>
              update.animating ? { ...update, animating: false } : update
            );
          }, 32);
        }
      });
    };

    animateToIndex();

    previousRouteKeyRef.current = focusedRouteKey;

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [descriptors, focusedRouteKey, navigation, state.index, state.routes, tabAnims]);

  const dimensions = SafeAreaProviderCompat.initialMetrics.frame;
  const [tabBarHeight, setTabBarHeight] = React.useState(() =>
    getTabBarHeight({
      state,
      descriptors,
      dimensions,
      insets: {
        ...SafeAreaProviderCompat.initialMetrics.insets,
        ...props.safeAreaInsets,
      },
      style: descriptors[state.routes[state.index]!.key]!.options.tabBarStyle,
    })
  );

  const renderTabBar = () => {
    return (
      <SafeAreaInsetsContext.Consumer>
        {(insets) =>
          tabBar({
            state,
            descriptors,
            navigation,
            insets: {
              top: safeAreaInsets?.top ?? insets?.top ?? 0,
              right: safeAreaInsets?.right ?? insets?.right ?? 0,
              bottom: safeAreaInsets?.bottom ?? insets?.bottom ?? 0,
              left: safeAreaInsets?.left ?? insets?.left ?? 0,
            },
          })
        }
      </SafeAreaInsetsContext.Consumer>
    );
  };

  const { routes } = state;

  // If there is no animation, we only have 2 states: visible and invisible
  const hasTwoStates = !routes.some((route) => hasAnimation(descriptors[route.key]!.options));

  const { tabBarPosition = 'bottom' } = descriptors[focusedRouteKey]!.options;

  const tabBarElement = (
    <BottomTabBarHeightCallbackContext.Provider key="tabbar" value={setTabBarHeight}>
      {renderTabBar()}
    </BottomTabBarHeightCallbackContext.Provider>
  );

  return (
    <SafeAreaProviderCompat
      style={{
        flexDirection: tabBarPosition === 'left' || tabBarPosition === 'right' ? 'row' : 'column',
      }}>
      {tabBarPosition === 'top' || tabBarPosition === 'left' ? tabBarElement : null}
      <MaybeScreenContainer
        key="screens"
        enabled={detachInactiveScreens}
        hasTwoStates={hasTwoStates}
        style={styles.screens}>
        {routes.map((route, index) => {
          const descriptor = descriptors[route.key]!;
          const {
            lazy = true,
            animation = 'none',
            sceneStyleInterpolator = NAMED_TRANSITIONS_PRESETS[animation]!.sceneStyleInterpolator,
          } = descriptor.options;
          const isFocused = state.index === index;
          const isPreloaded = state.preloadedRouteKeys.includes(route.key);

          if (lazy && !loaded.includes(route.key) && !isFocused && !isPreloaded) {
            // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
            return null;
          }

          const {
            freezeOnBlur,
            header = ({ layout, options }: BottomTabHeaderProps) => (
              <Header {...options} layout={layout} title={getHeaderTitle(options, route.name)} />
            ),
            headerShown,
            headerStatusBarHeight,
            headerTransparent,
            sceneStyle: customSceneStyle,
          } = descriptor.options;

          const { sceneStyle } =
            sceneStyleInterpolator?.({
              current: {
                progress: tabAnims[route.key]!,
              },
            }) ?? {};

          const animationEnabled = hasAnimation(descriptor.options);
          const isAnimatingRoute =
            lastUpdate.animating &&
            (lastUpdate.previous === route.key || lastUpdate.current === route.key);

          const activityState = isFocused
            ? STATE_ON_TOP // the screen is on top after the transition
            : animationEnabled && isAnimatingRoute // if animation is not enabled, immediately move to inactive state
              ? STATE_TRANSITIONING_OR_BELOW_TOP // screen visible during transition
              : STATE_INACTIVE;

          return (
            <MaybeScreen
              key={route.key}
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              active={activityState}
              enabled={detachInactiveScreens}
              freezeOnBlur={freezeOnBlur}
              shouldFreeze={activityState === STATE_INACTIVE && !isPreloaded}>
              <BottomTabBarHeightContext.Provider
                value={tabBarPosition === 'bottom' ? tabBarHeight : 0}>
                <Screen
                  focused={isFocused}
                  route={descriptor.route}
                  navigation={descriptor.navigation}
                  headerShown={headerShown}
                  headerStatusBarHeight={headerStatusBarHeight}
                  headerTransparent={headerTransparent}
                  header={header({
                    layout: dimensions,
                    route: descriptor.route,
                    navigation: descriptor.navigation as BottomTabNavigationProp<ParamListBase>,
                    options: descriptor.options,
                  })}
                  style={[customSceneStyle, animationEnabled && sceneStyle]}>
                  {descriptor.render()}
                </Screen>
              </BottomTabBarHeightContext.Provider>
            </MaybeScreen>
          );
        })}
      </MaybeScreenContainer>
      {tabBarPosition === 'bottom' || tabBarPosition === 'right' ? tabBarElement : null}
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  screens: {
    flex: 1,
    overflow: 'hidden',
  },
});
