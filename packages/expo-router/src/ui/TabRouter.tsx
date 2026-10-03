import {
  type CommonNavigationAction,
  extendRouterActions,
  type ParamListBase,
  type RouterActionContext,
  type TabActionType as RNTabActionType,
  type TabNavigationState,
  type TabRouterOptions as RNTabRouterOptions,
  TabRouter as RNTabRouter,
} from '../react-navigation/native';
import { ensureStateHistory } from '../react-navigation/routers/TabRouter';
import { attachRouteState, type RouteState } from '../react-navigation/routers/attachRouteState';
import { getTabRoute, type TriggerMap } from './common';

export type ExpoTabRouterOptions = RNTabRouterOptions & {
  triggerMap: TriggerMap;
};

export type ExpoTabActionType =
  | RNTabActionType
  | CommonNavigationAction
  | {
      type: 'JUMP_TO';
      source?: string;
      target?: string;
      payload: {
        name: string;
        resetOnFocus?: boolean;
        params?: object;
        state?: RouteState;
      };
    };

export const ExpoTabRouter = extendRouterActions(
  RNTabRouter,
  (
    state,
    action: ExpoTabActionType,
    {
      baseRouter,
      options,
    }: RouterActionContext<
      TabNavigationState<ParamListBase>,
      ExpoTabActionType,
      ExpoTabRouterOptions
    >
  ) => {
    if (action.type !== 'JUMP_TO') {
      return undefined;
    }

    const { route, isSwitching } = getTabRoute(state, action.payload.name);

    if (!route) {
      return undefined;
    }

    const shouldReset =
      'resetOnFocus' in action.payload && Boolean(action.payload.resetOnFocus && isSwitching);

    if (shouldReset) {
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

    if (!isSwitching && route.state !== undefined) {
      const selectedRoute = attachRouteState(route, action);
      if (selectedRoute === route) {
        state = ensureStateHistory(
          state,
          options.backBehavior ?? 'firstRoute',
          options.initialRouteName
        );
        return { state, affectedRouteKey: route.key };
      }
    }

    return baseRouter.getStateForAction(state, action);
  }
);
