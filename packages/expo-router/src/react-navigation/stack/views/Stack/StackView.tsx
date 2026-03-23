import {
  HeaderShownContext,
  SafeAreaProviderCompat,
} from '@react-navigation/elements';
import {
  CommonActions,
  type LocaleDirection,
  type ParamListBase,
  type Route,
  type RouteProp,
  StackActions,
  type StackNavigationState,
} from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import type {
  StackDescriptor,
  StackDescriptorMap,
  StackNavigationConfig,
  StackNavigationHelpers,
} from '../../types';
import { ModalPresentationContext } from '../../utils/ModalPresentationContext';
import { GestureHandlerRootView } from '../GestureHandler';
import {
  HeaderContainer,
  type Props as HeaderContainerProps,
} from '../Header/HeaderContainer';
import { CardStack, getAnimationEnabled } from './CardStack';

type Props = StackNavigationConfig & {
  direction: LocaleDirection;
  state: StackNavigationState<ParamListBase>;
  navigation: StackNavigationHelpers;
  descriptors: StackDescriptorMap;
  describe: (
    route: RouteProp<ParamListBase>,
    placeholder: boolean
  ) => StackDescriptor;
};

type State = {
  // Local copy of the routes which are actually rendered
  routes: Route<string>[];
  // Previous navigation state for comparison
  previousState: StackNavigationState<ParamListBase> | undefined;
  // Previous descriptors, to compare whether descriptors have changed or not
  previousDescriptors: StackDescriptorMap;
  // List of routes being opened, we need to animate pushing of these new routes
  openingRouteKeys: string[];
  // List of routes being closed, we need to animate popping of these routes
  closingRouteKeys: string[];
  // List of routes being replaced, we need to keep a copy until the new route animates in
  replacingRouteKeys: string[];
  // Since the local routes can vary from the routes from props, we need to keep the descriptors for old routes
  // Otherwise we won't be able to access the options for routes that were removed
  descriptors: StackDescriptorMap;
};

const GestureHandlerWrapper = GestureHandlerRootView ?? View;

/**
 * Compare two arrays with primitive values as the content.
 * We need to make sure that both values and order match.
 */
const isArrayEqual = (a: any[], b: any[]) =>
  a.length === b.length && a.every((it, index) => Object.is(it, b[index]));

export class StackView extends React.Component<Props, State> {
  static getDerivedStateFromProps(
    props: Readonly<Props>,
    state: Readonly<State>
  ) {
    const allRoutes = [...props.state.routes, ...props.state.preloadedRoutes];
    const previousRoutes = state.previousState
      ? [...state.previousState.routes, ...state.previousState.preloadedRoutes]
      : [];

    // If there was no change in routes, we don't need to compute anything
    if (
      isArrayEqual(
        allRoutes.map((r) => r.key),
        previousRoutes.map((r) => r.key)
      ) &&
      state.routes.length
    ) {
      // If there were any routes being closed or replaced,
      // We need to make sure they are preserved in the new state from props.state
      // So first we get all such routes from the previous state (that included the animating routes)
      // Then we add them back to the new state if they don't already exist

      const closingRoutes = state.routes.filter(
        (r) =>
          state.closingRouteKeys.includes(r.key) &&
          !props.state.routes.some((pr) => pr.key === r.key)
      );

      const replacingRoutes = state.routes.filter(
        (r) =>
          state.replacingRouteKeys.includes(r.key) &&
          !props.state.routes.some((pr) => pr.key === r.key)
      );

      let routes: Route<string>[] = props.state.routes.slice();

      // Replacing routes go before the focused route (they're being covered)
      if (replacingRoutes.length) {
        routes.splice(routes.length - 1, 0, ...replacingRoutes);
      }

      // Closing routes go at the end (they're animating out on top)
      if (closingRoutes.length) {
        routes.push(...closingRoutes);
      }

      let descriptors = props.descriptors;
      let previousDescriptors = state.previousDescriptors;

      if (props.descriptors !== state.previousDescriptors) {
        descriptors = routes.reduce<StackDescriptorMap>((acc, route) => {
          acc[route.key] =
            props.descriptors[route.key] || state.descriptors[route.key];

          return acc;
        }, {});

        previousDescriptors = props.descriptors;
      }

      if (!isArrayEqual(allRoutes, previousRoutes)) {
        // if any route objects have changed, we should update them
        const map = allRoutes.reduce<Record<string, Route<string>>>(
          (acc, route) => {
            acc[route.key] = route;
            return acc;
          },
          {}
        );

        routes = routes.map((route) => map[route.key] || route);
      }

      return {
        routes,
        previousState: props.state,
        descriptors,
        previousDescriptors,
      };
    }

    // Here we determine which routes were added or removed to animate them
    // We keep a copy of the route being removed in local state to be able to animate it

    let routes =
      props.state.index < props.state.routes.length - 1
        ? // Remove any extra routes from the state
          // The last visible route should be the focused route, i.e. at current index
          props.state.routes.slice(0, props.state.index + 1)
        : props.state.routes;

    let { openingRouteKeys, closingRouteKeys, replacingRouteKeys } = state;

    // If a route that was closing or being replaced is now back in the routes,
    // it was added back before the animation finished, so stop tracking it
    closingRouteKeys = closingRouteKeys.filter(
      (key) => !routes.some((r) => r.key === key)
    );

    replacingRouteKeys = replacingRouteKeys.filter(
      (key) => !routes.some((r) => r.key === key)
    );

    // Get previous focused route from previousState (actual focused route, not last in previousRoutes
    // which can be a preloaded route that was never focused)
    const previousFocusedRoute = state.previousState
      ? state.previousState.routes[state.previousState.index]
      : undefined;

    const nextFocusedRoute = routes[routes.length - 1];

    const isAnimationEnabled = (key: string) => {
      const descriptor = props.descriptors[key] || state.descriptors[key];

      return getAnimationEnabled(descriptor?.options.animation);
    };

    const getAnimationTypeForReplace = (key: string) => {
      const descriptor = props.descriptors[key] || state.descriptors[key];

      return descriptor.options.animationTypeForReplace ?? 'push';
    };

    if (
      previousFocusedRoute &&
      previousFocusedRoute.key !== nextFocusedRoute.key
    ) {
      // We only need to animate routes if the focused route changed
      // Animating previous routes won't be visible coz the focused route is on top of everything

      if (
        previousRoutes.some((r) => r.key === nextFocusedRoute.key) &&
        !routes.some((r) => r.key === previousFocusedRoute.key)
      ) {
        // The previously focused route was removed, and the new focused route was already present
        // We treat this as a pop

        if (
          isAnimationEnabled(previousFocusedRoute.key) &&
          !closingRouteKeys.includes(previousFocusedRoute.key)
        ) {
          closingRouteKeys = [...closingRouteKeys, previousFocusedRoute.key];

          // Sometimes a route can be closed before the opening animation finishes
          // So we also need to remove it from the opening list
          openingRouteKeys = openingRouteKeys.filter(
            (key) => key !== previousFocusedRoute.key
          );
          replacingRouteKeys = replacingRouteKeys.filter(
            (key) => key !== previousFocusedRoute.key
          );

          // Keep a copy of route being removed in the state to be able to animate it
          routes = [...routes, previousFocusedRoute];
        }
      } else {
        // A route has come to the focus, we treat this as a push
        // A replace or rearranging can also trigger this
        // The animation should look like push

        if (
          isAnimationEnabled(nextFocusedRoute.key) &&
          !openingRouteKeys.includes(nextFocusedRoute.key)
        ) {
          // In this case, we need to animate pushing the focused route
          // We don't care about animating any other added routes because they won't be visible
          openingRouteKeys = [...openingRouteKeys, nextFocusedRoute.key];

          closingRouteKeys = closingRouteKeys.filter(
            (key) => key !== nextFocusedRoute.key
          );
          replacingRouteKeys = replacingRouteKeys.filter(
            (key) => key !== nextFocusedRoute.key
          );

          if (!routes.some((r) => r.key === previousFocusedRoute.key)) {
            // The previous focused route isn't present in state, we treat this as a replace

            openingRouteKeys = openingRouteKeys.filter(
              (key) => key !== previousFocusedRoute.key
            );

            if (getAnimationTypeForReplace(nextFocusedRoute.key) === 'pop') {
              closingRouteKeys = [
                ...closingRouteKeys,
                previousFocusedRoute.key,
              ];

              // By default, new routes have a push animation, so we add it to `openingRouteKeys` before
              // But since user configured it to animate the old screen like a pop, we need to add this without animation
              // So remove it from `openingRouteKeys` which will remove the animation
              openingRouteKeys = openingRouteKeys.filter(
                (key) => key !== nextFocusedRoute.key
              );

              // Keep the route being removed at the end to animate it out
              routes = [...routes, previousFocusedRoute];
            } else {
              replacingRouteKeys = [
                ...replacingRouteKeys,
                previousFocusedRoute.key,
              ];

              closingRouteKeys = closingRouteKeys.filter(
                (key) => key !== previousFocusedRoute.key
              );

              // Keep the old route in the state because it's visible under the new route, and removing it will feel abrupt
              // We need to insert it just before the focused one (the route being pushed)
              // After the push animation is completed, routes being replaced will be removed completely
              routes = routes.slice();
              routes.splice(routes.length - 1, 0, previousFocusedRoute);

              // Preserve any other routes still being replaced from previous transitions
              const previousReplacingRoutes = state.routes.filter(
                (r) =>
                  replacingRouteKeys.includes(r.key) &&
                  !routes.some((existing) => existing.key === r.key)
              );

              if (previousReplacingRoutes.length) {
                // Insert before the route we just added (previousFocusedRoute)
                routes.splice(routes.length - 2, 0, ...previousReplacingRoutes);
              }
            }
          }
        }
      }
    } else if (replacingRouteKeys.length || closingRouteKeys.length) {
      // Keep the routes we are closing or replacing if animation is enabled for them
      routes = routes.slice();
      routes.splice(
        routes.length - 1,
        0,
        ...state.routes.filter(({ key }) =>
          isAnimationEnabled(key)
            ? replacingRouteKeys.includes(key) || closingRouteKeys.includes(key)
            : false
        )
      );
    }

    if (!routes.length) {
      throw new Error(
        'There should always be at least one route in the navigation state.'
      );
    }

    const descriptors = allRoutes.reduce<StackDescriptorMap>((acc, route) => {
      acc[route.key] =
        props.descriptors[route.key] || state.descriptors[route.key];

      return acc;
    }, {});

    return {
      routes,
      previousState: props.state,
      previousDescriptors: props.descriptors,
      openingRouteKeys,
      closingRouteKeys,
      replacingRouteKeys,
      descriptors,
    };
  }

  state: State = {
    routes: [],
    previousState: undefined,
    previousDescriptors: {},
    openingRouteKeys: [],
    closingRouteKeys: [],
    replacingRouteKeys: [],
    descriptors: {},
  };

  private getPreviousRoute = ({ route }: { route: Route<string> }) => {
    const { closingRouteKeys, replacingRouteKeys } = this.state;
    const routes = this.state.routes.filter(
      (r) =>
        r.key === route.key ||
        (!closingRouteKeys.includes(r.key) &&
          !replacingRouteKeys.includes(r.key))
    );

    const index = routes.findIndex((r) => r.key === route.key);

    return routes[index - 1];
  };

  private renderHeader = (props: HeaderContainerProps) => {
    return <HeaderContainer {...props} />;
  };

  private handleOpenRoute = ({ route }: { route: Route<string> }) => {
    const { state, navigation } = this.props;
    const { closingRouteKeys, replacingRouteKeys } = this.state;

    if (
      closingRouteKeys.some((key) => key === route.key) &&
      replacingRouteKeys.every((key) => key !== route.key) &&
      state.routeNames.includes(route.name) &&
      !state.routes.some((r) => r.key === route.key)
    ) {
      // If route isn't present in current state, but was closing, assume that a close animation was cancelled
      // So we need to add this route back to the state
      navigation.dispatch((state) => {
        const routes = [
          ...state.routes.filter((r) => r.key !== route.key),
          route,
        ];

        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        });
      });
    } else {
      this.setState((state) => {
        const routeIndex = state.routes.findIndex((r) => r.key === route.key);

        // Remove replacing routes that were before the route that just opened
        // Those were replaced by this or earlier routes and should be cleaned up
        const replacingRoutesToRemove = new Set(
          state.routes
            .slice(0, routeIndex)
            .filter((r) => state.replacingRouteKeys.includes(r.key))
            .map((r) => r.key)
        );

        const newRoutes = state.routes.filter(
          (r) => !replacingRoutesToRemove.has(r.key)
        );

        return {
          routes: newRoutes,
          openingRouteKeys: state.openingRouteKeys.filter(
            (key) => key !== route.key
          ),
          closingRouteKeys: state.closingRouteKeys.filter(
            (key) => key !== route.key
          ),
          replacingRouteKeys: state.replacingRouteKeys.filter(
            (key) => !replacingRoutesToRemove.has(key)
          ),
        };
      });
    }
  };

  private handleCloseRoute = ({ route }: { route: Route<string> }) => {
    const { state, navigation } = this.props;

    if (state.routes.some((r) => r.key === route.key)) {
      // If a route exists in state, trigger a pop
      // This will happen in when the route was closed from the card component
      // e.g. When the close animation triggered from a gesture ends
      navigation.dispatch({
        ...StackActions.pop(),
        source: route.key,
        target: state.key,
      });
    } else {
      // We need to clean up any state tracking the route and pop it immediately
      this.setState((state) => ({
        routes: state.routes.filter((r) => r.key !== route.key),
        openingRouteKeys: state.openingRouteKeys.filter(
          (key) => key !== route.key
        ),
        closingRouteKeys: state.closingRouteKeys.filter(
          (key) => key !== route.key
        ),
      }));
    }
  };

  private handleTransitionStart = (
    { route }: { route: Route<string> },
    closing: boolean
  ) =>
    this.props.navigation.emit({
      type: 'transitionStart',
      data: { closing },
      target: route.key,
    });

  private handleTransitionEnd = (
    { route }: { route: Route<string> },
    closing: boolean
  ) =>
    this.props.navigation.emit({
      type: 'transitionEnd',
      data: { closing },
      target: route.key,
    });

  private handleGestureStart = ({ route }: { route: Route<string> }) => {
    this.props.navigation.emit({
      type: 'gestureStart',
      target: route.key,
    });
  };

  private handleGestureEnd = ({ route }: { route: Route<string> }) => {
    this.props.navigation.emit({
      type: 'gestureEnd',
      target: route.key,
    });
  };

  private handleGestureCancel = ({ route }: { route: Route<string> }) => {
    this.props.navigation.emit({
      type: 'gestureCancel',
      target: route.key,
    });
  };

  render() {
    const {
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      descriptors: _,
      ...rest
    } = this.props;

    const { routes, descriptors, openingRouteKeys, closingRouteKeys } =
      this.state;

    const preloadedDescriptors =
      state.preloadedRoutes.reduce<StackDescriptorMap>((acc, route) => {
        acc[route.key] = acc[route.key] || this.props.describe(route, true);
        return acc;
      }, {});

    return (
      <GestureHandlerWrapper style={styles.container}>
        <SafeAreaProviderCompat>
          <SafeAreaInsetsContext.Consumer>
            {(insets) => (
              <ModalPresentationContext.Consumer>
                {(isParentModal) => (
                  <HeaderShownContext.Consumer>
                    {(isParentHeaderShown) => (
                      <CardStack
                        insets={insets!}
                        isParentHeaderShown={isParentHeaderShown}
                        isParentModal={isParentModal}
                        getPreviousRoute={this.getPreviousRoute}
                        routes={routes}
                        openingRouteKeys={openingRouteKeys}
                        closingRouteKeys={closingRouteKeys}
                        onOpenRoute={this.handleOpenRoute}
                        onCloseRoute={this.handleCloseRoute}
                        onTransitionStart={this.handleTransitionStart}
                        onTransitionEnd={this.handleTransitionEnd}
                        renderHeader={this.renderHeader}
                        state={state}
                        descriptors={descriptors}
                        onGestureStart={this.handleGestureStart}
                        onGestureEnd={this.handleGestureEnd}
                        onGestureCancel={this.handleGestureCancel}
                        preloadedDescriptors={preloadedDescriptors}
                        {...rest}
                      />
                    )}
                  </HeaderShownContext.Consumer>
                )}
              </ModalPresentationContext.Consumer>
            )}
          </SafeAreaInsetsContext.Consumer>
        </SafeAreaProviderCompat>
      </GestureHandlerWrapper>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
