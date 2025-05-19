'use client';
import {
  CommonNavigationAction,
  NavigationAction,
  ParamListBase,
  PartialRoute,
  PartialState,
  Route,
  RouterConfigOptions,
  StackRouter as RNStackRouter,
  StackActionType,
  StackNavigationState,
} from '@react-navigation/native';
import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { ComponentProps } from 'react';

import { withLayoutContext } from './withLayoutContext';
import { SingularOptions, getSingularId } from '../useScreens';
import { Protected } from '../views/Protected';

type GetId = NonNullable<RouterConfigOptions['routeGetIdList'][string]>;

const NativeStackNavigator = createNativeStackNavigator().Navigator;

const RNStack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof NativeStackNavigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(NativeStackNavigator);

function isStackAction(
  action: NavigationAction
): action is StackActionType | Extract<CommonNavigationAction, { type: 'NAVIGATE' }> {
  return (
    action.type === 'PUSH' ||
    action.type === 'NAVIGATE' ||
    action.type === 'POP' ||
    action.type === 'POP_TO_TOP' ||
    action.type === 'REPLACE'
  );
}

/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
export const stackRouterOverride: NonNullable<ComponentProps<typeof RNStack>['UNSTABLE_router']> = (
  original
) => {
  return {
    getStateForAction: (state, action, options) => {
      if (action.target && action.target !== state.key) {
        return null;
      }

      if (!isStackAction(action)) {
        return original.getStateForAction(state, action, options);
      }

      // The dynamic getId added to an action, `router.push('screen', { singular: true })`
      const actionSingularOptions =
        action.payload && 'singular' in action.payload
          ? (action.payload.singular as SingularOptions)
          : undefined;

      // Handle if 'getID' or 'singular' is set.
      function getIdFunction(fn?: GetId): GetId | undefined {
        // Actions can be fired by the user, so we do need to validate their structure.
        if (
          !('payload' in action) ||
          !action.payload ||
          !('name' in action.payload) ||
          typeof action.payload.name !== 'string'
        ) {
          return;
        }

        const name = action.payload.name;

        return (
          // The dynamic singular added to an action, `router.push('screen', { singular: () => 'id' })`
          getActionSingularIdFn(actionSingularOptions, name) ||
          // The static getId added as a prop to `<Screen singular />` or `<Screen getId={} />`
          options.routeGetIdList[name] ||
          // The custom singular added by Expo Router to support its concept of `navigate`
          fn
        );
      }

      switch (action.type) {
        case 'PUSH': {
          /**
           * PUSH should always push
           *
           * If 'getID' or 'singular' is set and a match is found, instead of pushing a new screen,
           * the existing screen will be moved to the HEAD of the stack. If there are multiple matches, the rest will be removed.
           */
          const nextState = original.getStateForAction(state, action, {
            ...options,
            routeGetIdList: {
              ...options.routeGetIdList,
              [action.payload.name]: getIdFunction(),
            },
          });

          /**
           * React Navigation doesn't support dynamic getId function on the action. Because of this,
           * can you enter a state where the screen is pushed multiple times but the normal getStateForAction
           * doesn't remove the duplicates. We need to filter the state to only have singular screens.
           */
          return actionSingularOptions
            ? filterSingular(nextState, actionSingularOptions)
            : nextState;
        }
        case 'NAVIGATE': {
          /**
           * NAVIGATE should push unless the current name & route params of the current and target screen match.
           * Search params and hashes should be ignored.
           *
           * If the name, route params & search params match, no action is taken.
           * If both the name and route params match, the screen is replaced.
           * If the name / route params do not match, the screen is pushed.
           *
           * If 'getID' or 'singular' is set and a match is found, instead of pushing a new screen,
           * the existing screen will be moved to the HEAD of the stack. If there are multiple matches, the rest will be removed.
           */
          const nextState = original.getStateForAction(state, action, {
            ...options,
            routeGetIdList: {
              ...options.routeGetIdList,
              [action.payload.name]: getIdFunction((options) => {
                return getSingularId(action.payload.name, options);
              }),
            },
          });

          /**
           * React Navigation doesn't support dynamic getId function on the action. Because of this,
           * can you enter a state where the screen is pushed multiple times but the normal getStateForAction
           * doesn't remove the duplicates. We need to filter the state to only have singular screens.
           */
          return actionSingularOptions
            ? filterSingular(nextState, actionSingularOptions)
            : nextState;
        }
        default: {
          return original.getStateForAction(state, action, options);
        }
      }
    },
  };
};

function getActionSingularIdFn(
  actionGetId: SingularOptions | undefined,
  name: string
): GetId | undefined {
  if (typeof actionGetId === 'function') {
    return (options) => actionGetId(name, options.params ?? {});
  } else if (actionGetId === true) {
    return (options) => getSingularId(name, options);
  }

  return undefined;
}

/**
 * If there is a dynamic singular on an action, then we need to filter the state to only have singular screens.
 * As multiples may have been added before we did the singular navigation.
 */
function filterSingular<
  T extends
    | StackNavigationState<ParamListBase>
    | PartialState<StackNavigationState<ParamListBase>>
    | null,
>(state: T, singular: SingularOptions): T {
  if (!state || !singular) {
    return state;
  }

  if (!state.routes) {
    return state;
  }

  const currentIndex = state.index || state.routes.length - 1;
  const current = state.routes[currentIndex];
  const name = current.name;

  const getId = getActionSingularIdFn(singular, name);

  if (!getId) {
    return state;
  }

  const id = getId({ params: current.params });

  if (!id) {
    return state;
  }

  // TypeScript needs a type assertion here for the filter to work.
  let routes = state.routes as PartialRoute<Route<string, object | undefined>>[];
  routes = routes.filter((route, index) => {
    // If the route is the current route, keep it.
    if (index === currentIndex) {
      return true;
    }

    // Remove all other routes with the same name and id.
    return name !== route.name || id !== getId({ params: route.params });
  });

  return {
    ...state,
    index: routes.length - 1,
    routes,
  };
}

const Stack = Object.assign(
  (props: ComponentProps<typeof RNStack>) => {
    return <RNStack {...props} UNSTABLE_router={stackRouterOverride} />;
  },
  {
    Screen: RNStack.Screen as (
      props: ComponentProps<typeof RNStack.Screen> & { singular?: boolean }
    ) => null,
    Protected,
  }
);

export default Stack;

export const StackRouter: typeof RNStackRouter = (options) => {
  const router = RNStackRouter(options);
  return {
    ...router,
    ...stackRouterOverride(router),
  };
};
