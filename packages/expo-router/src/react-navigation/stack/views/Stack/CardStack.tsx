import {
  getDefaultHeaderHeight,
  SafeAreaProviderCompat,
} from '@react-navigation/elements';
import type {
  LocaleDirection,
  ParamListBase,
  Route,
  StackNavigationState,
} from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import {
  forModalPresentationIOS,
  forNoAnimation as forNoAnimationCard,
} from '../../TransitionConfigs/CardStyleInterpolators';
import {
  BottomSheetAndroid,
  DefaultTransition,
  FadeFromBottomAndroid,
  FadeFromRightAndroid,
  ModalFadeTransition,
  ModalSlideFromBottomIOS,
  ModalTransition,
  RevealFromBottomAndroid,
  ScaleFromCenterAndroid,
  SlideFromLeftIOS,
  SlideFromRightIOS,
} from '../../TransitionConfigs/TransitionPresets';
import type {
  Layout,
  Scene,
  StackAnimationName,
  StackCardStyleInterpolator,
  StackDescriptorMap,
  StackHeaderMode,
  StackNavigationOptions,
  TransitionPreset,
} from '../../types';
import { findLastIndex } from '../../utils/findLastIndex';
import { getDistanceForDirection } from '../../utils/getDistanceForDirection';
import { getModalRouteKeys } from '../../utils/getModalRoutesKeys';
import type { Props as HeaderContainerProps } from '../Header/HeaderContainer';
import { MaybeScreen, MaybeScreenContainer } from '../Screens';
import { CardContainer } from './CardContainer';

type GestureValues = {
  [key: string]: Animated.Value;
};

type Props = {
  direction: LocaleDirection;
  insets: EdgeInsets;
  state: StackNavigationState<ParamListBase>;
  descriptors: StackDescriptorMap;
  preloadedDescriptors: StackDescriptorMap;
  routes: Route<string>[];
  openingRouteKeys: string[];
  closingRouteKeys: string[];
  onOpenRoute: (props: { route: Route<string> }) => void;
  onCloseRoute: (props: { route: Route<string> }) => void;
  getPreviousRoute: (props: {
    route: Route<string>;
  }) => Route<string> | undefined;
  renderHeader: (props: HeaderContainerProps) => React.ReactNode;
  isParentHeaderShown: boolean;
  isParentModal: boolean;
  onTransitionStart: (
    props: { route: Route<string> },
    closing: boolean
  ) => void;
  onTransitionEnd: (props: { route: Route<string> }, closing: boolean) => void;
  onGestureStart: (props: { route: Route<string> }) => void;
  onGestureEnd: (props: { route: Route<string> }) => void;
  onGestureCancel: (props: { route: Route<string> }) => void;
  detachInactiveScreens?: boolean;
};

type State = {
  routes: Route<string>[];
  descriptors: StackDescriptorMap;
  scenes: Scene[];
  gestures: GestureValues;
  layout: Layout;
  activeStates: (0 | 1 | Animated.AnimatedInterpolation<0 | 1>)[];
  headerHeights: Record<string, number>;
};

const NAMED_TRANSITIONS_PRESETS = {
  default: DefaultTransition,
  fade: ModalFadeTransition,
  fade_from_bottom: FadeFromBottomAndroid,
  fade_from_right: FadeFromRightAndroid,
  none: DefaultTransition,
  reveal_from_bottom: RevealFromBottomAndroid,
  scale_from_center: ScaleFromCenterAndroid,
  slide_from_left: SlideFromLeftIOS,
  slide_from_right: SlideFromRightIOS,
  slide_from_bottom: Platform.select({
    ios: ModalSlideFromBottomIOS,
    default: BottomSheetAndroid,
  }),
} as const satisfies Record<StackAnimationName, TransitionPreset>;

const EPSILON = 1e-5;

const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;

const FALLBACK_DESCRIPTOR = Object.freeze({ options: {} });

const getInterpolationIndex = (scenes: Scene[], index: number) => {
  const { cardStyleInterpolator } = scenes[index].descriptor.options;

  // Start from current card and count backwards the number of cards with same interpolation
  let interpolationIndex = 0;

  for (let i = index - 1; i >= 0; i--) {
    const cardStyleInterpolatorCurrent =
      scenes[i]?.descriptor.options.cardStyleInterpolator;

    if (cardStyleInterpolatorCurrent !== cardStyleInterpolator) {
      break;
    }

    interpolationIndex++;
  }

  return interpolationIndex;
};

const getIsModalPresentation = (
  cardStyleInterpolator: StackCardStyleInterpolator
) => {
  return (
    cardStyleInterpolator === forModalPresentationIOS ||
    // Handle custom modal presentation interpolators as well
    cardStyleInterpolator.name === 'forModalPresentationIOS'
  );
};

const getIsModal = (
  scene: Scene,
  interpolationIndex: number,
  isParentModal: boolean
) => {
  if (isParentModal) {
    return true;
  }

  const { cardStyleInterpolator } = scene.descriptor.options;
  const isModalPresentation = getIsModalPresentation(cardStyleInterpolator);
  const isModal = isModalPresentation && interpolationIndex !== 0;

  return isModal;
};

const getHeaderHeights = (
  scenes: Scene[],
  insets: EdgeInsets,
  isParentHeaderShown: boolean,
  isParentModal: boolean,
  layout: Layout,
  previous: Record<string, number>
) => {
  return scenes.reduce<Record<string, number>>((acc, curr, index) => {
    const {
      headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top,
      headerStyle,
    } = curr.descriptor.options;

    const style = StyleSheet.flatten(headerStyle || {});

    const height =
      'height' in style && typeof style.height === 'number'
        ? style.height
        : previous[curr.route.key];

    const interpolationIndex = getInterpolationIndex(scenes, index);
    const isModal = getIsModal(curr, interpolationIndex, isParentModal);

    acc[curr.route.key] =
      typeof height === 'number'
        ? height
        : getDefaultHeaderHeight(layout, isModal, headerStatusBarHeight);

    return acc;
  }, {});
};

const getDistanceFromOptions = (
  layout: Layout,
  options: StackNavigationOptions | undefined,
  isRTL: boolean
) => {
  if (options?.gestureDirection) {
    return getDistanceForDirection(layout, options.gestureDirection, isRTL);
  }

  const defaultGestureDirection =
    options?.presentation === 'modal'
      ? ModalTransition.gestureDirection
      : DefaultTransition.gestureDirection;

  const gestureDirection = options?.animation
    ? NAMED_TRANSITIONS_PRESETS[options?.animation]?.gestureDirection
    : defaultGestureDirection;

  return getDistanceForDirection(layout, gestureDirection, isRTL);
};

const getProgressFromGesture = (
  gesture: Animated.Value,
  layout: Layout,
  options: StackNavigationOptions | undefined,
  isRTL: boolean
) => {
  const distance = getDistanceFromOptions(
    {
      // Make sure that we have a non-zero distance, otherwise there will be incorrect progress
      // This causes blank screen on web if it was previously inside container with display: none
      width: Math.max(1, layout.width),
      height: Math.max(1, layout.height),
    },
    options,
    isRTL
  );

  if (distance > 0) {
    return gesture.interpolate({
      inputRange: [0, distance],
      outputRange: [1, 0],
    });
  }

  return gesture.interpolate({
    inputRange: [distance, 0],
    outputRange: [0, 1],
  });
};

function getDefaultAnimation(animation: StackAnimationName | undefined) {
  // Disable screen transition animation by default on web, windows and macos to match the native behavior
  const excludedPlatforms =
    Platform.OS !== 'web' &&
    Platform.OS !== 'windows' &&
    Platform.OS !== 'macos';

  return animation ?? (excludedPlatforms ? 'default' : 'none');
}

export function getAnimationEnabled(animation: StackAnimationName | undefined) {
  return getDefaultAnimation(animation) !== 'none';
}

export class CardStack extends React.Component<Props, State> {
  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
    if (
      props.routes === state.routes &&
      props.descriptors === state.descriptors
    ) {
      return null;
    }

    const gestures = [
      ...props.routes,
      ...props.state.preloadedRoutes,
    ].reduce<GestureValues>((acc, curr) => {
      const descriptor =
        props.descriptors[curr.key] || props.preloadedDescriptors[curr.key];
      const { animation } = descriptor?.options || {};

      acc[curr.key] =
        state.gestures[curr.key] ||
        new Animated.Value(
          (props.openingRouteKeys.includes(curr.key) &&
            getAnimationEnabled(animation)) ||
          props.state.preloadedRoutes.includes(curr)
            ? getDistanceFromOptions(
                state.layout,
                descriptor?.options,
                props.direction === 'rtl'
              )
            : 0
        );

      return acc;
    }, {});

    const modalRouteKeys = getModalRouteKeys(
      [...props.routes, ...props.state.preloadedRoutes],
      {
        ...props.descriptors,
        ...props.preloadedDescriptors,
      }
    );

    const scenes = [...props.routes, ...props.state.preloadedRoutes].map(
      (route, index, self) => {
        // For preloaded screens, we don't care about the previous and the next screen
        const isPreloaded = props.state.preloadedRoutes.includes(route);
        const previousRoute = isPreloaded ? undefined : self[index - 1];
        const nextRoute = isPreloaded ? undefined : self[index + 1];

        const oldScene = state.scenes[index];

        const currentGesture = gestures[route.key];
        const previousGesture = previousRoute
          ? gestures[previousRoute.key]
          : undefined;
        const nextGesture = nextRoute ? gestures[nextRoute.key] : undefined;

        const descriptor =
          (isPreloaded ? props.preloadedDescriptors : props.descriptors)[
            route.key
          ] ||
          state.descriptors[route.key] ||
          (oldScene ? oldScene.descriptor : FALLBACK_DESCRIPTOR);

        const nextOptions =
          nextRoute &&
          (
            props.descriptors[nextRoute?.key] ||
            state.descriptors[nextRoute?.key]
          )?.options;

        const previousOptions =
          previousRoute &&
          (
            props.descriptors[previousRoute?.key] ||
            state.descriptors[previousRoute?.key]
          )?.options;

        // When a screen is not the last, it should use next screen's transition config
        // Many transitions also animate the previous screen, so using 2 different transitions doesn't look right
        // For example combining a slide and a modal transition would look wrong otherwise
        // With this approach, combining different transition styles in the same navigator mostly looks right
        // This will still be broken when 2 transitions have different idle state (e.g. modal presentation),
        // but the majority of the transitions look alright
        const optionsForTransitionConfig =
          index !== self.length - 1 &&
          nextOptions &&
          nextOptions?.presentation !== 'transparentModal'
            ? nextOptions
            : descriptor.options;

        // Assume modal if there are already modal screens in the stack
        // or current screen is a modal when no presentation is specified
        const isModal = modalRouteKeys.includes(route.key);

        const animation = getDefaultAnimation(
          optionsForTransitionConfig.animation
        );

        const isAnimationEnabled = getAnimationEnabled(animation);

        const transitionPreset =
          animation !== 'default'
            ? NAMED_TRANSITIONS_PRESETS[animation]
            : optionsForTransitionConfig.presentation === 'transparentModal'
              ? ModalFadeTransition
              : optionsForTransitionConfig.presentation === 'modal' || isModal
                ? ModalTransition
                : DefaultTransition;

        const {
          gestureEnabled = Platform.OS === 'ios' && isAnimationEnabled,
          gestureDirection = transitionPreset.gestureDirection,
          transitionSpec = transitionPreset.transitionSpec,
          cardStyleInterpolator = isAnimationEnabled
            ? transitionPreset.cardStyleInterpolator
            : forNoAnimationCard,
          headerStyleInterpolator = transitionPreset.headerStyleInterpolator,
          cardOverlayEnabled = (Platform.OS !== 'ios' &&
            optionsForTransitionConfig.presentation !== 'transparentModal') ||
            getIsModalPresentation(cardStyleInterpolator),
        } = optionsForTransitionConfig;

        const headerMode: StackHeaderMode =
          descriptor.options.headerMode ??
          (!(
            optionsForTransitionConfig.presentation === 'modal' ||
            optionsForTransitionConfig.presentation === 'transparentModal' ||
            nextOptions?.presentation === 'modal' ||
            nextOptions?.presentation === 'transparentModal' ||
            getIsModalPresentation(cardStyleInterpolator)
          ) &&
          Platform.OS === 'ios' &&
          descriptor.options.header === undefined
            ? 'float'
            : 'screen');

        const isRTL = props.direction === 'rtl';

        const scene = {
          route,
          descriptor: {
            ...descriptor,
            options: {
              ...descriptor.options,
              animation,
              cardOverlayEnabled,
              cardStyleInterpolator,
              gestureDirection,
              gestureEnabled,
              headerStyleInterpolator,
              transitionSpec,
              headerMode,
            },
          },
          progress: {
            current: getProgressFromGesture(
              currentGesture,
              state.layout,
              descriptor.options,
              isRTL
            ),
            next:
              nextGesture && nextOptions?.presentation !== 'transparentModal'
                ? getProgressFromGesture(
                    nextGesture,
                    state.layout,
                    nextOptions,
                    isRTL
                  )
                : undefined,
            previous: previousGesture
              ? getProgressFromGesture(
                  previousGesture,
                  state.layout,
                  previousOptions,
                  isRTL
                )
              : undefined,
          },
          __memo: [
            state.layout,
            descriptor,
            nextOptions,
            previousOptions,
            currentGesture,
            nextGesture,
            previousGesture,
          ],
        };

        if (
          oldScene &&
          scene.__memo.every((it, i) => {
            // @ts-expect-error: we haven't added __memo to the annotation to prevent usage elsewhere
            return oldScene.__memo[i] === it;
          })
        ) {
          return oldScene;
        }

        return scene;
      }
    );

    let activeStates = state.activeStates;

    if (props.routes.length !== state.routes.length) {
      let activeScreensLimit = 1;

      for (let i = props.routes.length - 1; i >= 0; i--) {
        const { options } = scenes[i].descriptor;

        const {
          // By default, we don't want to detach the previous screen of the active one for modals
          detachPreviousScreen = options.presentation === 'transparentModal'
            ? false
            : getIsModalPresentation(options.cardStyleInterpolator)
              ? i !==
                findLastIndex(scenes, (scene) => {
                  const { cardStyleInterpolator } = scene.descriptor.options;

                  return (
                    cardStyleInterpolator === forModalPresentationIOS ||
                    cardStyleInterpolator?.name === 'forModalPresentationIOS'
                  );
                })
              : true,
        } = options;

        if (detachPreviousScreen === false) {
          activeScreensLimit++;
        } else {
          // Check at least last 2 screens before stopping
          // This will make sure that screen isn't detached when another screen is animating on top of the transparent one
          // e.g. opaque -> transparent -> opaque
          if (i <= props.routes.length - 2) {
            break;
          }
        }
      }

      activeStates = props.routes.map((_, index, self) => {
        // The activity state represents state of the screen:
        // 0 - inactive, the screen is detached
        // 1 - transitioning or below the top screen, the screen is mounted but interaction is disabled
        // 2 - on top of the stack, the screen is mounted and interaction is enabled
        let activityState:
          | Animated.AnimatedInterpolation<0 | 1 | 2>
          | 0
          | 1
          | 2;

        const lastActiveState = state.activeStates[index];
        const activeAfterTransition = index >= self.length - activeScreensLimit;

        if (lastActiveState === STATE_INACTIVE && !activeAfterTransition) {
          // screen was inactive before and it will still be inactive after the transition
          activityState = STATE_INACTIVE;
        } else {
          const sceneForActivity = scenes[self.length - 1];
          const outputValue =
            index === self.length - 1
              ? STATE_ON_TOP // the screen is on top after the transition
              : activeAfterTransition
                ? STATE_TRANSITIONING_OR_BELOW_TOP // the screen should stay active after the transition, it is not on top but is in activeLimit
                : STATE_INACTIVE; // the screen should be active only during the transition, it is at the edge of activeLimit

          activityState = sceneForActivity
            ? sceneForActivity.progress.current.interpolate({
                inputRange: [0, 1 - EPSILON, 1],
                outputRange: [1, 1, outputValue],
                extrapolate: 'clamp',
              })
            : STATE_TRANSITIONING_OR_BELOW_TOP;
        }

        return activityState;
      });
    }

    return {
      routes: props.routes,
      scenes,
      gestures,
      descriptors: props.descriptors,
      activeStates,
      headerHeights: getHeaderHeights(
        scenes,
        props.insets,
        props.isParentHeaderShown,
        props.isParentModal,
        state.layout,
        state.headerHeights
      ),
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      routes: [],
      scenes: [],
      gestures: {},
      layout: SafeAreaProviderCompat.initialMetrics.frame,
      descriptors: this.props.descriptors,
      activeStates: [],
      // Used when card's header is null and mode is float to make transition
      // between screens with headers and those without headers smooth.
      // This is not a great heuristic here. We don't know synchronously
      // on mount what the header height is so we have just used the most
      // common cases here.
      headerHeights: {},
    };
  }

  private handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    const layout = { width, height };

    this.setState((state, props) => {
      if (height === state.layout.height && width === state.layout.width) {
        return null;
      }

      return {
        layout,
        headerHeights: getHeaderHeights(
          state.scenes,
          props.insets,
          props.isParentHeaderShown,
          props.isParentModal,
          layout,
          state.headerHeights
        ),
      };
    });
  };

  private handleHeaderLayout = ({
    route,
    height,
  }: {
    route: Route<string>;
    height: number;
  }) => {
    this.setState(({ headerHeights }) => {
      const previousHeight = headerHeights[route.key];

      if (previousHeight === height) {
        return null;
      }

      return {
        headerHeights: {
          ...headerHeights,
          [route.key]: height,
        },
      };
    });
  };

  private getFocusedRoute = () => {
    const { state } = this.props;

    return state.routes[state.index];
  };

  private getPreviousScene = ({ route }: { route: Route<string> }) => {
    const { getPreviousRoute } = this.props;
    const { scenes } = this.state;

    const previousRoute = getPreviousRoute({ route });

    if (previousRoute) {
      const previousScene = scenes.find(
        (scene) => scene.descriptor.route.key === previousRoute.key
      );

      return previousScene;
    }

    return undefined;
  };

  render() {
    const {
      insets,
      state,
      routes,
      openingRouteKeys,
      closingRouteKeys,
      onOpenRoute,
      onCloseRoute,
      renderHeader,
      isParentHeaderShown,
      isParentModal,
      onTransitionStart,
      onTransitionEnd,
      onGestureStart,
      onGestureEnd,
      onGestureCancel,
      detachInactiveScreens = Platform.OS === 'web' ||
        Platform.OS === 'android' ||
        Platform.OS === 'ios',
    } = this.props;

    const { scenes, layout, gestures, activeStates, headerHeights } =
      this.state;

    const focusedRoute = state.routes[state.index];
    const focusedHeaderHeight = headerHeights[focusedRoute.key];

    const isFloatHeaderAbsolute = this.state.scenes.slice(-2).some((scene) => {
      const options = scene.descriptor.options ?? {};
      const { headerMode, headerTransparent, headerShown = true } = options;

      if (
        headerTransparent ||
        headerShown === false ||
        headerMode === 'screen'
      ) {
        return true;
      }

      return false;
    });

    return (
      <View style={styles.container}>
        {renderHeader({
          mode: 'float',
          layout,
          scenes,
          getPreviousScene: this.getPreviousScene,
          getFocusedRoute: this.getFocusedRoute,
          onContentHeightChange: this.handleHeaderLayout,
          style: [
            styles.floating,
            isFloatHeaderAbsolute && [
              // Without this, the header buttons won't be touchable on Android when headerTransparent: true
              { height: focusedHeaderHeight },
              styles.absolute,
            ],
          ],
        })}
        <MaybeScreenContainer
          enabled={detachInactiveScreens}
          style={styles.container}
          onLayout={this.handleLayout}
        >
          {[...routes, ...state.preloadedRoutes].map((route, index) => {
            const focused = focusedRoute.key === route.key;
            const gesture = gestures[route.key];
            const scene = scenes[index];
            // It is possible that for a short period the route appears in both arrays.
            // Particularly, if the screen is removed with `retain`, then it needs a moment to execute the animation.
            // However, due to the router action, it immediately populates the `preloadedRoutes` array.
            // Practically, the logic below takes care that it is rendered only once.
            const isPreloaded =
              state.preloadedRoutes.includes(route) && !routes.includes(route);
            if (
              state.preloadedRoutes.includes(route) &&
              routes.includes(route) &&
              index >= routes.length
            ) {
              return null;
            }

            const {
              headerShown = true,
              headerTransparent,
              freezeOnBlur,
              autoHideHomeIndicator,
            } = scene.descriptor.options;

            const safeAreaInsetTop = insets.top;
            const safeAreaInsetRight = insets.right;
            const safeAreaInsetBottom = insets.bottom;
            const safeAreaInsetLeft = insets.left;

            const headerHeight =
              headerShown !== false ? headerHeights[route.key] : 0;

            // Start from current card and count backwards the number of cards with same interpolation
            const interpolationIndex = getInterpolationIndex(scenes, index);
            const isModal = getIsModal(
              scene,
              interpolationIndex,
              isParentModal
            );

            const isNextScreenTransparent =
              scenes[index + 1]?.descriptor.options.presentation ===
              'transparentModal';

            const detachCurrentScreen =
              scenes[index + 1]?.descriptor.options.detachPreviousScreen !==
              false;

            const activityState = isPreloaded
              ? STATE_INACTIVE
              : activeStates[index];

            return (
              <MaybeScreen
                key={route.key}
                style={[StyleSheet.absoluteFill]}
                enabled={detachInactiveScreens}
                active={activityState}
                freezeOnBlur={freezeOnBlur}
                shouldFreeze={activityState === STATE_INACTIVE && !isPreloaded}
                homeIndicatorHidden={autoHideHomeIndicator}
                pointerEvents="box-none"
              >
                <CardContainer
                  index={index}
                  interpolationIndex={interpolationIndex}
                  modal={isModal}
                  active={index === routes.length - 1}
                  focused={focused}
                  opening={openingRouteKeys.includes(route.key)}
                  closing={closingRouteKeys.includes(route.key)}
                  layout={layout}
                  gesture={gesture}
                  scene={scene}
                  safeAreaInsetTop={safeAreaInsetTop}
                  safeAreaInsetRight={safeAreaInsetRight}
                  safeAreaInsetBottom={safeAreaInsetBottom}
                  safeAreaInsetLeft={safeAreaInsetLeft}
                  onGestureStart={onGestureStart}
                  onGestureCancel={onGestureCancel}
                  onGestureEnd={onGestureEnd}
                  headerHeight={headerHeight}
                  isParentHeaderShown={isParentHeaderShown}
                  onHeaderHeightChange={this.handleHeaderLayout}
                  getPreviousScene={this.getPreviousScene}
                  getFocusedRoute={this.getFocusedRoute}
                  hasAbsoluteFloatHeader={
                    isFloatHeaderAbsolute && !headerTransparent
                  }
                  renderHeader={renderHeader}
                  onOpenRoute={onOpenRoute}
                  onCloseRoute={onCloseRoute}
                  onTransitionStart={onTransitionStart}
                  onTransitionEnd={onTransitionEnd}
                  isNextScreenTransparent={isNextScreenTransparent}
                  detachCurrentScreen={detachCurrentScreen}
                  preloaded={isPreloaded}
                />
              </MaybeScreen>
            );
          })}
        </MaybeScreenContainer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
  },
  floating: {
    zIndex: 1,
  },
});
