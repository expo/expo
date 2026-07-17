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
import { focusChild } from '../react-navigation/routers';
import { pruneReplacedRoute } from '../react-navigation/routers/TabRouter';
import type { TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

type ReplaceAction = Extract<StackActionType, { type: 'REPLACE' }>;

type ExpoTabJumpToAction = {
  type: 'JUMP_TO';
  source?: string;
  target?: string;
  payload: {
    name: string;
    resetOnFocus?: boolean;
    params?: object;
  };
};

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | ReplaceAction
  | ExpoTabJumpToAction;

export function ExpoTabRouter(options: ExpoTabRouterOptions) {
  const rnTabRouter = RNTabRouter(options);

  const router: Router<
    TabNavigationState<ParamListBase>,
    ExpoTabActionType | CommonNavigationAction
  > = {
    ...rnTabRouter,
    getStateForAction(state, action, options) {
      const isReplace = isReplaceAction(action);

      // Only JUMP_TO is handled here; a REPLACE is normalized into a JUMP_TO first, and anything
      // else is delegated to the base tab router unchanged. We keep the normalized action in its
      // own variable so reassigning it doesn't break narrowing of `action`.
      let jumpToAction: ExpoTabJumpToAction;
      if (isReplace) {
        jumpToAction = {
          ...action,
          type: 'JUMP_TO',
        };
        // Generate the state as if we were using JUMP_TO
        const nextState = rnTabRouter.getStateForAction(state, jumpToAction, options);

        if (!nextState || nextState.index === undefined) {
          return null;
        }

        // TODO(@ubax): Remove the casting once there is only a single state shape
        // We can assert that nextState is TabNavigationState here, because we checked for index above
        state = nextState as TabNavigationState<ParamListBase>;
      } else if (action.type === 'JUMP_TO') {
        jumpToAction = action;
      } else {
        return rnTabRouter.getStateForAction(state, action, options);
      }

      if (!state || !state.routeNames.includes(jumpToAction.payload.name)) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      const route = state.routes.find((route) => route.name === jumpToAction.payload.name);

      // A declared route that's absent from `state.routes` is a lazy tab that hasn't loaded yet
      // (presence is the loaded signal). The base router creates it on focus, so this is a first
      // visit: reset, with no prior route key/state to clear.
      let shouldReset = !route || !route.state;

      if (
        route &&
        !shouldReset &&
        'resetOnFocus' in jumpToAction.payload &&
        jumpToAction.payload.resetOnFocus
      ) {
        shouldReset = state.routes[state.index ?? 0]!.key !== route.key;
      }

      let nextState: ReturnType<typeof rnTabRouter.getStateForAction>;

      if (shouldReset) {
        if (route) {
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
        }
        nextState = rnTabRouter.getStateForAction(state, jumpToAction, options);
      } else {
        nextState = rnTabRouter.getStateForAction(
          state,
          focusChild(route!.key) as unknown as CommonNavigationAction,
          options
        );
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
