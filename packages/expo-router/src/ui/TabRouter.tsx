import {
  CommonNavigationAction,
  ParamListBase,
  TabRouter as RNTabRouter,
  Router,
  TabActionType as RNTabActionType,
  TabNavigationState,
  TabRouterOptions as RNTabRouterOptions,
  type StackActionType,
  type NavigationAction,
} from '@react-navigation/native';

import { TriggerMap } from './common';

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
      if (isReplaceAction(action)) {
        action = {
          ...action,
          type: 'JUMP_TO',
        };
        // Generate the state as if we were using JUMP_TO
        const nextState = rnTabRouter.getStateForAction(state, action, options);

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
      } else if (action.type !== 'JUMP_TO') {
        return rnTabRouter.getStateForAction(state, action, options);
      }

      const route = state.routes.find((route) => route.name === action.payload.name);

      if (!route || !state) {
        // This shouldn't occur, but lets just hand it off to the next navigator in case.
        return null;
      }

      // We should reset if this is the first time visiting the route
      let shouldReset = !state.history?.some((item) => item.key === route?.key) && !route.state;

      if (!shouldReset && 'resetOnFocus' in action.payload && action.payload.resetOnFocus) {
        shouldReset = state.routes[state.index ?? 0].key !== route.key;
      }

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
        return rnTabRouter.getStateForAction(state, action, options);
      } else {
        return rnTabRouter.getStateForRouteFocus(state, route.key);
      }
    },
  };

  return router;
}

function isReplaceAction(action: NavigationAction): action is ReplaceAction {
  return action.type === 'REPLACE';
}
