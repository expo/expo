import {
  type ParamListBase,
  type PartialState,
  type Router,
  StackActions,
  type StackNavigationState,
} from '@react-navigation/native';
import { nanoid } from 'nanoid/non-secure';

export type NativeStackState = StackNavigationState<ParamListBase> & {
  poppedRoutes: Set<string>;
};

type NativeStackAction = {
  type: string;
  payload?: object;
  source?: string;
  target?: string;
};

function createParams(
  routeParamList: ParamListBase,
  name: string,
  params?: object
): object | undefined {
  const defaults = routeParamList[name];
  return defaults ? { ...defaults, ...params } : params;
}

function createRoute(routeParamList: ParamListBase, name: string, params?: object) {
  return {
    key: `${name}-${nanoid()}`,
    name,
    params: createParams(routeParamList, name, params),
  };
}

export type NativeStackRouterOptions = {
  initialRouteName?: string;
};

export function NativeStackRouter({
  initialRouteName,
}: NativeStackRouterOptions): Router<NativeStackState, NativeStackAction> {
  function pickInitialRouteName(routeNames: string[]) {
    return initialRouteName && routeNames.includes(initialRouteName)
      ? initialRouteName
      : routeNames[0];
  }

  return {
    type: 'stack',

    getInitialState({ routeNames, routeParamList }) {
      console.log('getInitialState', { routeNames, initialRouteName });
      const name = pickInitialRouteName(routeNames);

      return {
        stale: false as const,
        type: 'stack' as const,
        key: `stack-${nanoid()}`,
        index: 0,
        routeNames,
        routes: [createRoute(routeParamList, name)],
        preloadedRoutes: [],
        poppedRoutes: new Set<string>(),
      };
    },

    getRehydratedState(partialState, { routeNames, routeParamList }) {
      if (partialState.stale === false) {
        return partialState as NativeStackState;
      }
      console.log('getRehydratedState', { partialState, routeNames, initialRouteName });

      let routes = (partialState.routes ?? [])
        .filter((r) => routeNames.includes(r.name))
        .map((r) => ({
          ...r,
          key: r.key || `${r.name}-${nanoid()}`,
          params: createParams(routeParamList, r.name, r.params as object | undefined),
        }));

      if (routes.length === 0) {
        const name = pickInitialRouteName(routeNames);
        routes = [createRoute(routeParamList, name)];
      }

      return {
        stale: false as const,
        type: 'stack' as const,
        key: `stack-${nanoid()}`,
        index: partialState.index ?? routes.length - 1,
        routeNames,
        routes,
        preloadedRoutes: [],
        poppedRoutes: new Set<string>(),
      };
    },

    getStateForRouteNamesChange(state, { routeNames, routeParamList, routeKeyChanges }) {
      const routes = state.routes.filter(
        (r) => routeNames.includes(r.name) && !routeKeyChanges.includes(r.name)
      );

      if (routes.length === 0) {
        const name = pickInitialRouteName(routeNames);
        return {
          ...state,
          routeNames,
          index: 0,
          routes: [createRoute(routeParamList, name)],
        };
      }

      return {
        ...state,
        routeNames,
        index: Math.min(state.index, routes.length - 1),
        routes,
      };
    },

    getStateForRouteFocus(state, key) {
      const index = state.routes.findIndex((r) => r.key === key);
      if (index === -1 || index === state.index) {
        return state;
      }
      return {
        ...state,
        index,
        routes: state.routes.slice(0, index + 1),
      };
    },

    getStateForAction(state, action, options) {
      const { routeNames, routeParamList } = options;
      const payload = action.payload as Record<string, any> | undefined;
      console.log('getStateForAction', action.type);

      switch (action.type) {
        case 'PUSH': {
          const name: string = payload?.name;
          const params: object | undefined = payload?.params;
          if (!routeNames.includes(name)) {
            return null;
          }
          const route = createRoute(routeParamList, name, params);
          const routes = [...state.routes, route];
          return {
            ...state,
            index: routes.length - 1,
            routes,
          };
        }

        case 'NAVIGATE': {
          return this.getStateForAction(
            state,
            {
              type: 'PUSH',
              payload: action.payload,
              source: action.source,
              target: action.target,
            },
            options
          );
        }

        case 'POP': {
          const count = Math.max(payload?.count ?? 1, 1);
          const currentIndex = action.source
            ? state.routes.findIndex((r) => r.key === action.source)
            : state.index;

          if (currentIndex <= 0) {
            return null;
          }

          // Keep at least 1 route from the bottom, remove `count` from below currentIndex
          const keepCount = Math.max(currentIndex - count + 1, 1);
          const poppedRoutes = state.routes.slice(keepCount, currentIndex + 1).map(r => r.key);

          // The route removal will happen in the next action (when the screen is dismissed on native side)
          return {
            ...state,
            index: keepCount - 1,
            poppedRoutes: new Set([...state.poppedRoutes, ...poppedRoutes]),
          };
        }

        case 'POP_TO_TOP': {
          return this.getStateForAction(
            state,
            { type: 'POP', payload: { count: state.routes.length - 1 } },
            options
          );
        }

        case 'REPLACE': {
          const name: string = payload?.name;
          const params: object | undefined = payload?.params;
          if (!routeNames.includes(name)) {
            return null;
          }

          const currentIndex =
            action.target === state.key && action.source
              ? state.routes.findIndex((r) => r.key === action.source)
              : state.index;

          if (currentIndex !== state.index) {
            throw new Error(
              'REPLACE is only supported for the focused route in Native Stack Router.'
            );
          }

          if (currentIndex === -1) {
            return null;
          }

          const route = createRoute(routeParamList, name, params);
          const routes = [...state.routes.slice(-1), route];
          return { ...state, routes };
        }

        case 'GO_BACK': {
          return this.getStateForAction(
            state,
            {
              type: 'POP',
              payload: { count: 1 },
              source: action.source,
              target: action.target,
            },
            options
          );
        }

        case 'SET_PARAMS': {
          throw new Error('SET_PARAMS action is not supported yet');
        }

        case 'REPLACE_PARAMS': {
          throw new Error('REPLACE_PARAMS action is not supported yet');
        }

        case 'RESET': {
          const nextState = payload as
            | PartialState<NativeStackState>
            | NativeStackState
            | undefined;

          if (!nextState?.routes?.length) {
            return null;
          }

          if (nextState.routes.some((r: { name: string }) => !routeNames.includes(r.name))) {
            return null;
          }

          if (nextState.stale === false) {
            return nextState as NativeStackState;
          }

          // Rehydrate partial state into a full state
          return this.getRehydratedState(nextState, options);
        }

        default:
          return null;
      }
    },

    shouldActionChangeFocus(action) {
      return action.type === 'NAVIGATE';
    },

    actionCreators: StackActions,
  };
}
