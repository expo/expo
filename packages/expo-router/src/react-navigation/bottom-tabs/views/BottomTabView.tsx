'use client';
import * as React from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { getHeaderTitle, Header, SafeAreaProviderCompat, Screen } from '../../elements';
import { type ParamListBase } from '../../native';
import { FadeTransition, ShiftTransition } from '../TransitionConfigs/TransitionPresets';
import type {
  BottomTabBarProps,
  BottomTabDescriptorMap,
  BottomTabEmitter,
  BottomTabHeaderProps,
  BottomTabNavigationConfig,
  BottomTabNavigationOptions,
  BottomTabNavigationProp,
  BottomTabViewState,
} from '../types';
import { BottomTabBarHeightCallbackContext } from '../utils/BottomTabBarHeightCallbackContext';
import { BottomTabBarHeightContext } from '../utils/BottomTabBarHeightContext';
import { useAnimatedHashMap } from '../utils/useAnimatedHashMap';
import { BottomTabBar, getTabBarHeight } from './BottomTabBar';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';

type Props = BottomTabNavigationConfig & {
  state: BottomTabViewState;
  descriptors: BottomTabDescriptorMap;
  emitter: BottomTabEmitter;
  navigateToTab: (routeKey: string) => void;
  popNestedStackToTop: (routeKey: string) => void;
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
    descriptors,
    emitter,
    navigateToTab,
    popNestedStackToTop,
    safeAreaInsets,
    detachInactiveScreens = Platform.OS === 'web' ||
      Platform.OS === 'android' ||
      Platform.OS === 'ios',
  } = props;

  const focusedRouteKey = state.routes[state.index]!.key;

  // Keys of tabs that have been focused during this mount. Only blurred tabs from this list are
  // frozen, so a tab is never frozen before it has rendered once.
  const [loaded, setLoaded] = React.useState([focusedRouteKey]);

  if (!loaded.includes(focusedRouteKey)) {
    // Set the current tab to be loaded if it was not loaded before
    setLoaded([...loaded, focusedRouteKey]);
  }

  // Which tabs take part in the transition that runs now. This is React state and not a value
  // derived from the animation, because the animation runs on the native driver: an interrupted
  // transition can leave the native value away from its target, and a screen that is focused then
  // stays detached and renders blank.
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

  const previousRouteKeyRef = React.useRef(focusedRouteKey);
  const tabAnims = useAnimatedHashMap(state);

  React.useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;

    const shouldPopPreviousToTop =
      previousRouteKey !== focusedRouteKey &&
      !!descriptors[previousRouteKey]?.options.popToTopOnBlur;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const animateToIndex = () => {
      if (previousRouteKey !== focusedRouteKey) {
        emitter.emit({
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
        if (finished && shouldPopPreviousToTop) {
          popNestedStackToTop(previousRouteKey);
        }

        if (previousRouteKey !== focusedRouteKey) {
          emitter.emit({
            type: 'transitionEnd',
            target: focusedRouteKey,
          });
        }

        if (finished) {
          // Delay clearing so the previous screen stays attached.
          // This gives time for any native logic to run.
          timer = setTimeout(() => {
            setLastUpdate((update) => (update.animating ? { ...update, animating: false } : update));
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
  }, [
    descriptors,
    focusedRouteKey,
    emitter,
    popNestedStackToTop,
    state.index,
    state.routes,
    tabAnims,
  ]);

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
            emitter,
            navigateToTab,
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
            animation = 'none',
            sceneStyleInterpolator = NAMED_TRANSITIONS_PRESETS[animation]!.sceneStyleInterpolator,
          } = descriptor.options;
          const isFocused = state.index === index;

          if (descriptor.route.key === undefined) {
            // Don't render placeholder screens.
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
            : animationEnabled && isAnimatingRoute
              ? STATE_TRANSITIONING_OR_BELOW_TOP // screen visible during transition
              : STATE_INACTIVE; // the screen is detached after transition

          return (
            <MaybeScreen
              key={route.key}
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              active={activityState}
              enabled={detachInactiveScreens}
              freezeOnBlur={freezeOnBlur}
              // TODO: A visited blurred tab re-preloaded with new params stays frozen until focused.
              shouldFreeze={activityState === STATE_INACTIVE && loaded.includes(route.key)}>
              <BottomTabBarHeightContext.Provider
                value={tabBarPosition === 'bottom' ? tabBarHeight : 0}>
                <Screen
                  focused={isFocused}
                  route={route}
                  navigation={descriptor.navigation}
                  headerShown={headerShown}
                  headerStatusBarHeight={headerStatusBarHeight}
                  headerTransparent={headerTransparent}
                  header={header({
                    layout: dimensions,
                    route,
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
