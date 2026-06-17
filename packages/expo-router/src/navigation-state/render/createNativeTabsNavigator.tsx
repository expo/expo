'use client';
// R-Phase D — a NativeTabs navigator that renders from the new tree (Decisions R-2/P-10/R-12).
//
// `mount ≠ promotion` (P-10): the native tab bar mounts every declared `<NativeTabs.Trigger>`, but
// the tree only holds *promoted* tabs — so the tab list comes from the triggers + route tree, and a
// not-yet-visited tab renders a default (its initial route). Switching resolves a `focus` on the
// tabs node (set-index if promoted, else insert+set-index). Reuses the existing `NativeTabsView`.

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { createEmitter } from './emitter';
import { NavNodeProvider, useNavNodeSlice } from './navNodeContext';
import { createStackNavigationShim } from './navigationShim';
import { useRouteNode, type RouteNode } from '../../Route';
import { convertTabPropsToOptions, isNativeTabTrigger } from '../../native-tabs/NativeTabTrigger';
import { NativeTabsView } from '../../native-tabs/NativeTabsView';
import type {
  NativeTabOptions,
  NativeTabsViewTabItem,
  OnTabChangeEventPayload,
} from '../../native-tabs/types';
import { ThemeProvider } from '../../react-navigation/core/theming/ThemeProvider';
import { DefaultTheme } from '../../react-navigation/native';
import { getQualifiedRouteComponent } from '../../useScreens';
import { registerBehavior } from '../behaviorMap';
import { resolve } from '../behaviors';
import { createRouteKey } from '../keys';
import { dispatchNav } from '../store';
import { ROOT_NAME } from '../tree';
import type { NavNode, RouteEntry } from '../types';

type DeclaredTab = { name: string; options: NativeTabOptions };

/** Declared, non-hidden tabs (ordered) from the `<NativeTabs.Trigger>` children, with their options. */
function declaredTabs(children: ReactNode): DeclaredTab[] {
  const tabs: DeclaredTab[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && isNativeTabTrigger(child)) {
      const props = child.props as { name: string };
      const options = convertTabPropsToOptions(props as never, true);
      if (options.hidden !== true) tabs.push({ name: props.name, options });
    }
  });
  return tabs;
}

/** A default content node for a tab not yet promoted/navigated to (its initial route). */
function defaultTabNode(screenNode: RouteNode): NavNode {
  const initial = screenNode.initialRouteName ?? screenNode.children[0]?.route;
  const routes: RouteEntry[] = initial ? [{ key: createRouteKey(initial), name: initial }] : [];
  return { key: createRouteKey(`${screenNode.route}.nav`), index: 0, routes };
}

export function NativeTabs({ children }: { children?: ReactNode }) {
  const node = useNavNodeSlice();
  const layoutNode = useRouteNode();
  const emitter = useRef(createEmitter()).current;
  const provenanceRef = useRef(0);
  // Default content nodes are minted once per tab name so a not-promoted tab keeps a stable identity
  // (and its in-tab state) across unrelated navigations, instead of remounting every render.
  const defaultNodes = useRef(new Map<string, NavNode>()).current;

  const behaviorName = layoutNode?.route || ROOT_NAME;
  useEffect(() => registerBehavior(behaviorName, 'tabs'), [behaviorName]);

  const screensByName = useMemo(() => {
    const map = new Map<string, RouteNode>();
    for (const child of layoutNode?.children ?? []) map.set(child.route, child);
    return map;
  }, [layoutNode]);

  const getDefaultNode = useCallback(
    (name: string, screenNode: RouteNode) => {
      let cached = defaultNodes.get(name);
      if (!cached) {
        cached = defaultTabNode(screenNode);
        defaultNodes.set(name, cached);
      }
      return cached;
    },
    [defaultNodes]
  );

  const tabs = useMemo<NativeTabsViewTabItem[]>(() => {
    return declaredTabs(children).map((tab) => {
      const screenNode = screensByName.get(tab.name);
      if (!screenNode) {
        throw new Error(
          `expo-router: NativeTabs trigger "${tab.name}" has no matching route. (enableNewStateModel)`
        );
      }
      const promoted = node.routes.find((route) => route.name === tab.name);
      const routeKey = promoted?.key ?? `${tab.name}#tab`;
      const contentNode = promoted?.child ?? getDefaultNode(tab.name, screenNode);
      const navigation = createStackNavigationShim(routeKey, {
        node,
        dispatch: dispatchNav,
        emitter,
      });
      return {
        options: tab.options,
        routeKey,
        name: tab.name,
        contentRenderer: () => {
          const Screen = getQualifiedRouteComponent(screenNode);
          return (
            <NavNodeProvider node={contentNode}>
              <Screen route={{ key: routeKey, name: tab.name }} navigation={navigation} />
            </NavNodeProvider>
          );
        },
      };
    });
  }, [children, screensByName, node, emitter, getDefaultNode]);

  const focusedName = node.routes[node.index]?.name;
  const focusedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.name === focusedName)
  );

  const onTabChange = useCallback(
    (event: OnTabChangeEventPayload) => {
      const { selectedKey, provenance, isNativeAction = false, isPrevented = false } = event;
      // A disabled tab the native side blocked: don't navigate or touch provenance (mirror old NativeTabs).
      if (isPrevented) return;
      provenanceRef.current = provenance;
      // Only a native tap drives state here; a JS-origin echo was already handled by the router path.
      if (!isNativeAction) return;
      const tab = tabs.find((t) => t.routeKey === selectedKey);
      const screenNode = tab && screensByName.get(tab.name);
      if (!tab || !screenNode) return;
      const route: RouteEntry = {
        key: tab.routeKey,
        name: tab.name,
        child: getDefaultNode(tab.name, screenNode),
      };
      dispatchNav({ ops: resolve({ type: 'focus', route }, node, 'tabs'), source: 'native' });
    },
    [tabs, screensByName, node, getDefaultNode]
  );

  return (
    <ThemeProvider value={DefaultTheme}>
      <NativeTabsView
        tabs={tabs}
        focusedIndex={focusedIndex}
        provenance={provenanceRef.current}
        onTabChange={onTabChange}
      />
    </ThemeProvider>
  );
}
