import type { TriggerMap } from './common';
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
import { pruneReplacedRoute } from '../react-navigation/routers/TabRouter';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

type ReplaceAction = Extract<StackActionType, { type: 'REPLACE' }>;

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | ReplaceAction
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
    getStateForAction(state, action, options) {
      const isReplace = isReplaceAction(action);

      if (isReplace) {
        action = {
          ...action,
          type: 'JUMP_TO',
        };
        // Generate the state as if we were using JUMP_TO
        const nextState = rnTabRouter.getStateForAction(state, action, options);

        if (!nextState || nextState.index === undefined) {
          return null;
        }

        // TODO(@ubax): Remove the casting once there is only a single state shape
        // We can assert that nextState is TabNavigationState here, because we checked for index above
        state = nextState as TabNavigationState<ParamListBase>;
      } else if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, options);
      }

      if (!state || !state.routeNames.includes(action.payload.name)) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index ?? 0]!.key !== route.key;
      }

      let nextState: ReturnType<typeof rnTabRouter.getStateForAction>;

      if (shouldReset) {
        options.routeParamList[route.name] = {
          ...options.routeParamList[route.name],
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
        nextState = rnTabRouter.getStateForAction(state, action, options);
      } else {
        nextState = rnTabRouter.getStateForRouteFocus(state, route.key);
      }

      // A REPLACE drops the route it replaced from the back stack.
      if (isReplace && nextState) {
        return pruneReplacedRoute(nextState as TabNavigationState<ParamListBase>);
      }

      return nextState;
    },
  };

  return router;
}

function isReplaceAction(action: NavigationAction): action is ReplaceAction {
  return action.type === 'REPLACE';
}
