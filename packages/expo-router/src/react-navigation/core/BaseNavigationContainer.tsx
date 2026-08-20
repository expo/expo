'use client';
import isEqual from 'fast-deep-equal';
import * as React from 'react';
import { use } from 'react';

import type { RouteNode } from '../../Route';
import { findFocusedRoute } from '../../fork/findFocusedRoute';
import { RouterRegistryContext, RouterRegistryProvider } from '../../global-state/routerRegistry';
import { useNavigationTreeReducer } from '../../global-state/useNavigationTreeReducer';
import useLatestCallback from '../../utils/useLatestCallback';
import {
  CommonActions,
  type InitialState,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Route,
} from '../routers';
import { EnsureSingleNavigator } from './EnsureSingleNavigator';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationStateContext } from './NavigationStateContext';
import { checkDuplicateRouteNames } from './checkDuplicateRouteNames';
import { checkSerializable } from './checkSerializable';
import { NOT_INITIALIZED_ERROR } from './createNavigationContainerRef';
import { ThemeProvider } from './theming/ThemeProvider';
import type {
  NavigationContainerEventMap,
  NavigationContainerProps,
  NavigationContainerRef,
} from './types';
import { useChildListeners } from './useChildListeners';
import { useClientLayoutEffect } from './useClientLayoutEffect';
import { useEventEmitter } from './useEventEmitter';
import { useKeyedChildListeners } from './useKeyedChildListeners';
import { FUNCTIONAL_DISPATCH_ERROR } from './useNavigationHelpers';
import { useOptionsGetters } from './useOptionsGetters';

type InternalNavigationContainerProps = Omit<NavigationContainerProps, 'initialState'> & {
  initialState: InitialState;
  ref?: React.Ref<NavigationContainerRef<ParamListBase>>;
  UNSTABLE_routeNode?: RouteNode;
  UNSTABLE_onStateChangeInsertion?: (state: NavigationState) => void;
};

const serializableWarnings: string[] = [];
const duplicateNameWarnings: string[] = [];

/**
 * Container component which holds the navigation state.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree.
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled.
 * @param props.theme Theme object for the UI elements.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
export function BaseNavigationContainer(props: InternalNavigationContainerProps) {
  const registry = use(RouterRegistryContext);
  const independent = useNavigationIndependentTree();

  // TODO(@ubax): investigate if this is really needed
  if (registry === undefined || independent) {
    return (
      <RouterRegistryProvider>
        <BaseNavigationContainerInner {...props} />
      </RouterRegistryProvider>
    );
  }

  return <BaseNavigationContainerInner {...props} />;
}

function BaseNavigationContainerInner({
  ref,
  initialState,
  onStateChange,
  onReady,
  onUnhandledAction,
  UNSTABLE_routeNode,
  UNSTABLE_onStateChangeInsertion,
  theme,
  children,
}: InternalNavigationContainerProps) {
  const parent = use(NavigationStateContext);
  if (!parent.isDefault) {
    throw new Error(
      "Looks like you have nested a 'NavigationContainer' inside another. Normally you need only one container at the root of the app, so this was probably an error. If you need to render an isolated navigation tree inside a screen, install '@react-navigation/native' and use its NavigationContainer instead."
    );
  }

  const registry = use(RouterRegistryContext)!;
  const emitter = useEventEmitter<NavigationContainerEventMap>();
  // TODO(@ubax): investigate if this is really needed
  const stackRef = React.useRef<string | undefined>(undefined);
  const onDispatchAction = useLatestCallback((action: NavigationAction, noop: boolean) => {
    emitter.emit({
      type: '__unsafe_action__',
      data: { action, noop, stack: stackRef.current },
    });
  });

  // TODO(@ubax): consider moving this state to ExpoRoot.
  const { state, getState, getStateForKey, handleAction } = useNavigationTreeReducer({
    initialState,
    routeNode: UNSTABLE_routeNode,
    registry,
    onUnhandledAction: onUnhandledAction ?? defaultOnUnhandledAction,
    onDispatchAction,
    onStateChangeInsertion: UNSTABLE_onStateChangeInsertion,
  });

  const hasNotifiedInitialStateRef = React.useRef(false);
  const lastNotifiedStateRef = React.useRef<NavigationState | undefined>(undefined);

  const { listeners, addListener } = useChildListeners();

  const { addKeyedListener } = useKeyedChildListeners();

  const dispatch = useLatestCallback((action: NavigationAction) => {
    if (typeof action === 'function') {
      throw new Error(FUNCTIONAL_DISPATCH_ERROR);
    }

    if (listeners.focus[0] == null) {
      console.error(NOT_INITIALIZED_ERROR);
    } else {
      listeners.focus[0]((navigation) => navigation.dispatch(action));
    }
  });

  const dispatchSync = useLatestCallback(
    (action: NavigationAction | ((state: NavigationState) => NavigationAction)) => {
      if (listeners.focus[0] == null) {
        console.error(NOT_INITIALIZED_ERROR);
      } else {
        listeners.focus[0]((navigation) => navigation.dispatchSync(action));
      }
    }
  );

  const canGoBack = useLatestCallback(() => {
    if (listeners.focus[0] == null) {
      return false;
    }

    const { result, handled } = listeners.focus[0]((navigation) => navigation.canGoBack());

    if (handled) {
      return result;
    } else {
      return false;
    }
  });

  const getRootState = useLatestCallback(() => {
    return getState();
  });

  const getCurrentRoute = useLatestCallback(() => {
    const state = getRootState();

    if (state == null) {
      return undefined;
    }

    const route = findFocusedRoute(state);

    return route as Route<string> | undefined;
  });

  const isReady = useLatestCallback(
    () => listeners.focus[0] != null && registry.has(getState().key)
  );

  const { addOptionsGetter, getCurrentOptions } = useOptionsGetters({});

  const navigation: NavigationContainerRef<ParamListBase> = React.useMemo(
    () => ({
      ...Object.keys(CommonActions).reduce<any>((acc, name) => {
        acc[name] = (...args: any[]) =>
          // @ts-expect-error: this is ok
          dispatch(CommonActions[name](...args));
        return acc;
      }, {}),
      ...emitter.create('root'),
      dispatch,
      dispatchSync,
      isFocused: () => true,
      canGoBack,
      getParent: () => undefined,
      getState,
      getRootState,
      getCurrentRoute,
      getCurrentOptions,
      isReady,
      setOptions: () => {
        throw new Error('Cannot call setOptions outside a screen');
      },
    }),
    [
      canGoBack,
      dispatch,
      dispatchSync,
      emitter,
      getCurrentOptions,
      getCurrentRoute,
      getRootState,
      getState,
      isReady,
    ]
  );

  React.useImperativeHandle(ref, () => navigation, [navigation]);

  const lastEmittedOptionsRef = React.useRef<object | undefined>(undefined);

  // TODO(@ubax): investigate if there is better way to implemnet this and wether this is really needed,
  const onOptionsChange = useLatestCallback((options: object) => {
    if (lastEmittedOptionsRef.current && isEqual(lastEmittedOptionsRef.current, options)) {
      return;
    }

    lastEmittedOptionsRef.current = options;

    emitter.emit({
      type: 'options',
      data: { options },
    });
  });

  const builderContext = React.useMemo(
    () => ({
      addListener,
      addKeyedListener,
      handleAction,
      getStateForKey,
      onDispatchAction,
      onOptionsChange,
      stackRef,
    }),
    [addListener, addKeyedListener, getStateForKey, handleAction, onDispatchAction, onOptionsChange]
  );

  const context = React.useMemo(
    () => ({
      state,
      addOptionsGetter,
    }),
    [state, addOptionsGetter]
  );

  const onReadyRef = React.useRef(onReady);
  const onStateChangeRef = React.useRef(onStateChange);

  React.useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onReadyRef.current = onReady;
  });

  const onReadyCalledRef = React.useRef(false);

  React.useEffect(() => {
    if (!onReadyCalledRef.current && isReady()) {
      onReadyCalledRef.current = true;
      onReadyRef.current?.();
      emitter.emit({ type: 'ready' });
    }
  }, [state, registry, isReady, emitter]);

  useClientLayoutEffect(() => {
    const hydratedState = getRootState();

    if (process.env.NODE_ENV !== 'production') {
      if (hydratedState !== undefined) {
        const serializableResult = checkSerializable(hydratedState);

        if (!serializableResult.serializable) {
          const { location, reason } = serializableResult;

          let path = '';
          let pointer: Record<any, any> = hydratedState;
          let params = false;

          for (let i = 0; i < location.length; i++) {
            const curr = location[i]!;
            const prev = location[i - 1];

            pointer = pointer[curr];

            if (!params && curr === 'state') {
              continue;
            } else if (!params && curr === 'routes') {
              if (path) {
                path += ' > ';
              }
            } else if (!params && typeof curr === 'number' && prev === 'routes') {
              path += pointer?.name;
            } else if (!params) {
              path += ` > ${curr}`;
              params = true;
            } else {
              if (typeof curr === 'number' || /^[0-9]+$/.test(curr)) {
                path += `[${curr}]`;
              } else if (/^[a-z$_]+$/i.test(curr)) {
                path += `.${curr}`;
              } else {
                path += `[${JSON.stringify(curr)}]`;
              }
            }
          }

          const message = `Non-serializable values were found in the navigation state. Check:\n\n${path} (${reason})\n\nThis can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details.`;

          if (!serializableWarnings.includes(message)) {
            serializableWarnings.push(message);
            console.warn(message);
          }
        }

        const duplicateRouteNamesResult = checkDuplicateRouteNames(hydratedState);

        if (duplicateRouteNamesResult.length) {
          const message = `Found screens with the same name nested inside one another. Check:\n${duplicateRouteNamesResult.map(
            (locations) => `\n${locations.join(', ')}`
          )}\n\nThis can cause confusing behavior during navigation. Consider using unique names for each screen instead.`;

          if (!duplicateNameWarnings.includes(message)) {
            duplicateNameWarnings.push(message);
            console.warn(message);
          }
        }
      }
    }

    // TODO(@ubax): invesitagte if there is cleaner way to do it
    // If not consider deprecating the prop
    const onStateChange = onStateChangeRef.current;
    const shouldNotifyStateChange =
      hasNotifiedInitialStateRef.current &&
      lastNotifiedStateRef.current !== hydratedState &&
      onStateChange !== undefined;
    hasNotifiedInitialStateRef.current = true;
    lastNotifiedStateRef.current = hydratedState;

    emitter.emit({ type: 'state', data: { state } });

    if (shouldNotifyStateChange) {
      onStateChange(hydratedState);
    }
  }, [getRootState, emitter, state]);

  return (
    <NavigationContainerRefContext.Provider value={navigation}>
      <NavigationBuilderContext.Provider value={builderContext}>
        <NavigationStateContext.Provider value={context}>
          <EnsureSingleNavigator>
            <ThemeProvider value={theme}>{children}</ThemeProvider>
          </EnsureSingleNavigator>
        </NavigationStateContext.Provider>
      </NavigationBuilderContext.Provider>
    </NavigationContainerRefContext.Provider>
  );
}

// TODO(@ubax): investigate if this is really needed and if v57 approach is not better
function defaultOnUnhandledAction(action: NavigationAction): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const payload: Record<string, any> | undefined = action.payload;
  let message = `The action '${action.type}'${
    payload ? ` with payload ${JSON.stringify(action.payload)}` : ''
  } was not handled by any navigator.`;

  switch (action.type) {
    case 'PRELOAD':
    case 'NAVIGATE':
    case 'PUSH':
    case 'REPLACE':
    case 'POP_TO':
    case 'JUMP_TO':
      if (payload?.name) {
        message += `\n\nDo you have a screen named '${payload.name}'?\n\nIf you're trying to navigate to a screen in a nested navigator, see https://reactnavigation.org/docs/nesting-navigators#navigating-to-a-screen-in-a-nested-navigator.\n\nIf you're using conditional rendering, navigation will happen automatically and you shouldn't navigate manually, see.`;
      } else {
        message += `\n\nYou need to pass the name of the screen to navigate to.\n\nSee https://reactnavigation.org/docs/navigation-actions for usage.`;
      }
      break;
    case 'GO_BACK':
    case 'POP':
    case 'POP_TO_TOP':
      message += `\n\nIs there any screen to go back to?`;
      break;
    case 'OPEN_DRAWER':
    case 'CLOSE_DRAWER':
    case 'TOGGLE_DRAWER':
      message += `\n\nIs your screen inside a Drawer navigator?`;
      break;
  }

  message += `\n\nThis is a development-only warning and won't be shown in production.`;
  console.error(message);
}
