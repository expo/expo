'use client';
// R-Phase B — a Stack navigator that renders REAL screens from the new tree (Decisions R-2).
//
// It reads its NavNode slice, projects it into the shape `NativeStackView` consumes, builds a
// descriptor per route (screen via expo-router's own `getQualifiedRouteComponent`, wrapped in a
// `NavNodeProvider` so a nested navigator gets its `child` slice — the recursion seam), attaches a
// per-screen `navigation` shim, and hands it all to the existing `NativeStackView`. No
// `useNavigationBuilder`: the new reducer owns state. Everything derived is memoized on the slice
// (reference-stable across unrelated dispatches), so screen `navigation` identity is stable and an
// unrelated navigation does not thrash screen effects.

import { useEffect, useMemo, useRef, type ComponentType } from 'react';

import { createEmitter } from './emitter';
import { NavNodeProvider, useNavNodeSlice } from './navNodeContext';
import { createStackNavigationShim } from './navigationShim';
import { projectToStackState } from './projectToStackState';
import { useRouteNode, type RouteNode } from '../../Route';
import { NavigationHelpersContext } from '../../react-navigation/core/NavigationHelpersContext';
import { NavigationMetaContext } from '../../react-navigation/core/NavigationMetaContext';
import { PreventRemoveProvider } from '../../react-navigation/core/PreventRemoveProvider';
import { ThemeProvider } from '../../react-navigation/core/theming/ThemeProvider';
import { FocusedRouteKeyContext } from '../../react-navigation/core/useIsFocused';
import { NavigationStateListenerProvider } from '../../react-navigation/core/useNavigationState';
import { DefaultTheme } from '../../react-navigation/native';
import { NativeStackView } from '../../react-navigation/native-stack/views/NativeStackView';
import { getQualifiedRouteComponent } from '../../useScreens';
import { registerBehavior } from '../behaviorMap';
import { dispatchNav } from '../store';
import { ROOT_NAME } from '../tree';
import type { NavNode } from '../types';

type Descriptor = {
  route: { key: string; name: string; params?: object };
  navigation: ReturnType<typeof createStackNavigationShim>;
  options: object;
  render: () => React.JSX.Element;
};

// The shared contract of NativeStackView / ExperimentalStackView (their real prop types are stricter
// than our projection, so call sites cast the concrete view).
type StackViewComponent = ComponentType<{
  state: unknown;
  navigation: unknown;
  descriptors: unknown;
  describe: unknown;
}>;

function useStackDescriptors(node: NavNode, layoutNode: RouteNode | null) {
  const emitter = useRef(createEmitter()).current;
  return useMemo(() => {
    const screensByName = new Map<string, RouteNode>();
    for (const child of layoutNode?.children ?? []) {
      screensByName.set(child.route, child);
    }
    const descriptors: Record<string, Descriptor> = {};
    for (const route of node.routes) {
      const navigation = createStackNavigationShim(route.key, {
        node,
        dispatch: dispatchNav,
        emitter,
      });
      const routeProp = { key: route.key, name: route.name, params: route.params };
      const screenNode = screensByName.get(route.name);
      if (!screenNode) {
        throw new Error(
          `expo-router: no screen matches route "${route.name}" in this navigator. The new state ` +
            `model expected a child route for it. (enableNewStateModel)`
        );
      }
      const child = route.child;
      descriptors[route.key] = {
        route: routeProp,
        navigation,
        options: {},
        render: () => {
          const Screen = getQualifiedRouteComponent(screenNode);
          const element = <Screen route={routeProp} navigation={navigation} />;
          // Hand the nested navigator (if any) its slice — the recursion seam.
          return child ? <NavNodeProvider node={child}>{element}</NavNodeProvider> : element;
        },
      };
    }
    return descriptors;
  }, [node, layoutNode, emitter]);
}

/** Build a tree-driven stack navigator for a given native stack VIEW. Both `NativeStackView` and
 * `ExperimentalStackView` consume the same `{state, navigation, descriptors, describe}` contract, so
 * they share everything here — only the view differs (R-Phase B/E). */
export function createTreeStackNavigator(View: StackViewComponent) {
  return function TreeStackNavigator() {
    const node = useNavNodeSlice();
    const layoutNode = useRouteNode();

    // Register this navigator's behavior so the resolvers (back/navigate) look it up by the name
    // `focusedChain` uses: the owning route's name, or ROOT_NAME for the app root (route '').
    const behaviorName = layoutNode?.route || ROOT_NAME;
    useEffect(() => registerBehavior(behaviorName, 'stack'), [behaviorName]);

    const descriptors = useStackDescriptors(node, layoutNode);
    const state = useMemo(() => projectToStackState(node), [node]);
    const focused = node.routes[node.index];
    // Reuse the focused screen's shim as the navigator-level navigation (no second instance).
    const navigation = descriptors[focused?.key ?? '']?.navigation;

    // `describe` only fires for preloadedRoutes, which the new tree never produces (D6) — fail loudly
    // if that assumption breaks rather than silently building a descriptor for an undesigned path.
    const describe = () => {
      throw new Error('expo-router: preloaded routes are not supported under enableNewStateModel.');
    };

    // The providers the stack view depends on, normally supplied by useNavigationBuilder's
    // NavigationContent. Each screen gets its own shim via the per-scene NavigationProvider the view
    // sets up; NavigationHelpersContext backs PreventRemoveProvider's state read.
    return (
      <ThemeProvider value={DefaultTheme}>
        <NavigationMetaContext.Provider value={undefined}>
          <NavigationHelpersContext.Provider value={navigation as never}>
            <NavigationStateListenerProvider state={state as never}>
              <FocusedRouteKeyContext.Provider value={focused?.key}>
                <PreventRemoveProvider>
                  <View
                    // Shapes match what the view reads; RN types are stricter than our projection.
                    state={state}
                    navigation={navigation}
                    descriptors={descriptors}
                    describe={describe}
                  />
                </PreventRemoveProvider>
              </FocusedRouteKeyContext.Provider>
            </NavigationStateListenerProvider>
          </NavigationHelpersContext.Provider>
        </NavigationMetaContext.Provider>
      </ThemeProvider>
    );
  };
}

export const Stack = createTreeStackNavigator(NativeStackView as StackViewComponent);
