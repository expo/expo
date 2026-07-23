import {
  type CommonNavigationAction,
  type ParamListBase,
  type Router,
  type TabActionType as RNTabActionType,
  type TabNavigationState,
  type TabRouterOptions as RNTabRouterOptions,
  type StackActionType,
  type NavigationAction,
  TabRouter as RNTabRouter,
} from '../react-navigation/native';
import { getRouteHistory } from '../react-navigation/routers/TabRouter';
import type { TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

type ReplaceAction = Extract<StackActionType, { type: 'REPLACE' }>;

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | ReplaceAction
  | { type: 'EXPO_ROUTER_TAB_ORDER_CHANGED'; source?: string; target?: string }
  | {
      type: 'JUMP_TO';
      source?: string;
      target?: string;
      payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
      };
    };

export function ExpoTabRouter(options: ExpoTabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    ExpoTabActionType | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, routerConfigOptions) {
      if (action.type === 'EXPO_ROUTER_TAB_ORDER_CHANGED') {
        const backBehavior = options.backBehavior ?? 'firstRoute';

        if (
          backBehavior !== 'firstRoute' &&
          backBehavior !== 'initialRoute' &&
          backBehavior !== 'order'
        ) {
          return state;
        }

        const history = getRouteHistory(
          state.routes,
          state.index,
          backBehavior,
          options.initialRouteName
        );

        if (
          history.length === state.history.length &&
          history.every((item, index) => item.key === state.history[index]!.key)
        ) {
          return state;
        }

        return { ...state, history };
      }

      if (isReplaceAction(action)) {
        action = {
          ...action,
          type: 'JUMP_TO',
        };
        // Generate the state as if we were using JUMP_TO
        const nextState = rnTabRouter.getStateForAction(state, action, routerConfigOptions);

        if (!nextState || nextState.index === undefined || !Array.isArray(nextState.history)) {
          return null;
        }

        // We can assert that nextState is TabNavigationState here, because we checked for index and history above
        state = nextState as TabNavigationState<ParamListBase>;

        // If the state is valid and we didn't JUMP_TO a single history state,
        // then remove the previous state.
        if (state.index !== 0) {
          const previousIndex = state.index - 1;

          state = {
            ...state,
            key: `${state.key}-replace`,
            // Omit the previous history entry that we are replacing
            history: [
              ...state.history.slice(0, previousIndex),
              ...state.history.splice(state.index),
            ],
          };
        }
        return state;
      } else if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route || !state) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !state.history?.some((item) => item.key === route?.key) && !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index ?? 0]!.key !== route.key;
      }

      if (shouldReset) {
        routerConfigOptions.routeParamList[route.name] = {
          ...routerConfigOptions.routeParamList[route.name],
        };
        state = {
          ...state,
          routes: state.routes.map((r) => {
            if (r.key !== route.key) {
              return r;
            }
            return { ...r, state: undefined };
          }),
        };
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      } else if (route.state !== undefined) {
        // TODO(@ubax): Remove this branch together with nested trigger href support. Refocusing
        // a tab that hosts a navigator must not re-apply the trigger's nested payload
        // (`params.screen`), which would reset the preserved child state.
        return rnTabRouter.getStateForRouteFocus(state, route.key);
      } else {
        return rnTabRouter.getStateForAction(state, action, routerConfigOptions);
      }
    },
  };

  return router;
}

function isReplaceAction(action: NavigationAction): action is ReplaceAction {
  return action.type === 'REPLACE';
}
