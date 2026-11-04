import React from 'react';
import {
  Appearance,
  StatusBar as NativeStatusBar,
  useColorScheme,
  type ColorSchemeName,
  type StatusBarProps as NativeStatusBarProps,
} from 'react-native';

import ExpoStatusBar from './ExpoStatusBar';
import type {
  StatusBarProps,
  StatusBarStackEntry,
  StatusBarStyle,
  StatusBarAnimation,
  VerticalBarBehaviorIOS,
  VerticalBarEdgeIOS,
} from './types';

/**
 * A component that allows you to configure your status bar declaratively.
 *
 * You will likely have multiple `StatusBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `StatusBar` component will be merged in the order that they were mounted.
 * This component is built on top of the [StatusBar](https://reactnative.dev/docs/statusbar)
 * component exported from React Native, and it provides defaults that work better for Expo users.
 */
export function StatusBar({
  style,
  hideTransitionAnimation,
  animated,
  hidden,
  verticalBarBehaviorIOS,
}: StatusBarProps) {
  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();
  const barStyle = React.useMemo(
    () => styleToBarStyle(style, colorScheme ?? undefined),
    [style, colorScheme]
  );

  const verticalBarBehaviorEntry = React.useRef<VerticalBarBehaviorEntry>({});

  React.useEffect(() => {
    const entry = verticalBarBehaviorEntry.current;
    verticalBarBehaviorStack.push(entry);
    return () => {
      verticalBarBehaviorStack.splice(verticalBarBehaviorStack.indexOf(entry), 1);
      updateVerticalBarBehavior();
    };
  }, []);

  React.useEffect(() => {
    verticalBarBehaviorEntry.current.behavior = verticalBarBehaviorIOS;
    updateVerticalBarBehavior();
  }, [verticalBarBehaviorIOS]);

  return (
    <NativeStatusBar
      animated={animated}
      hidden={hidden}
      barStyle={barStyle}
      showHideTransition={hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation}
    />
  );
}

type VerticalBarBehaviorEntry = { behavior?: VerticalBarBehaviorIOS };

// Mirrors the props stack of React Native's `StatusBar`: the most recently mounted component that
// sets `verticalBarBehaviorIOS` wins, and `setVerticalBarBehaviorIOS()` sets the fallback.
const verticalBarBehaviorStack: VerticalBarBehaviorEntry[] = [];
let defaultVerticalBarBehavior: VerticalBarBehaviorIOS = 'automatic';
let appliedVerticalBarBehavior: VerticalBarBehaviorIOS = 'automatic';

function updateVerticalBarBehavior() {
  let behavior = defaultVerticalBarBehavior;
  for (const entry of verticalBarBehaviorStack) {
    behavior = entry.behavior ?? behavior;
  }
  if (behavior !== appliedVerticalBarBehavior) {
    appliedVerticalBarBehavior = behavior;
    ExpoStatusBar?.setVerticalBarBehavior(behavior);
  }
}

// @needsAudit
/**
 * Set the bar style of the status bar.
 *
 * @param style The color of the status bar text.
 * @param animated If the transition should be animated.
 *
 * @example
 * ```ts
 * StatusBar.setStyle('dark', true);
 * ```
 */
StatusBar.setStyle = (style: StatusBarStyle, animated?: boolean): void =>
  NativeStatusBar.setBarStyle(styleToBarStyle(style), animated);

/**
 * @deprecated Use `StatusBar.setStyle` instead. This will be removed in a future release.
 */
export const setStatusBarStyle = StatusBar.setStyle;

// @needsAudit
/**
 * Toggle visibility of the status bar. Has no effect on iPhone Duo, where the status bar is in a
 * vertical bar. Use `verticalBarBehaviorIOS` to move it back to the top.
 *
 * @param hidden If the status bar should be hidden.
 * @param animation Animation to use when toggling hidden, defaults to `'none'`.
 *
 * @example
 * ```ts
 * StatusBar.setHidden(true, 'slide');
 * ```
 */
StatusBar.setHidden = (hidden: boolean, animation?: StatusBarAnimation): void =>
  NativeStatusBar.setHidden(hidden, animation);

/**
 * @deprecated Use `StatusBar.setHidden` instead. This will be removed in a future release.
 */
export const setStatusBarHidden = StatusBar.setHidden;

/**
 * Push an entry onto the status bar stack. An entry works like a mounted `StatusBar` component:
 * the most recent entry or component wins for each prop that it sets. A prop that the entry does
 * not set comes from the entries below. Use this to change the status bar outside a component,
 * for example while a system picker is open.
 *
 * @param props The props of the entry. An `'auto'` or `'inverted'` style resolves when you push
 * or replace the entry, as in `StatusBar.setStyle()`.
 * @return The entry. Pass it to `StatusBar.popStackEntry()` when you are done.
 *
 * @example
 * ```ts
 * const entry = StatusBar.pushStackEntry({ style: 'light' });
 * try {
 *   await pickImage();
 * } finally {
 *   StatusBar.popStackEntry(entry);
 * }
 * ```
 */
StatusBar.pushStackEntry = (props: StatusBarProps): StatusBarStackEntry => {
  const verticalBarBehaviorEntry = { behavior: props.verticalBarBehaviorIOS };
  verticalBarBehaviorStack.push(verticalBarBehaviorEntry);
  updateVerticalBarBehavior();
  return {
    nativeEntry: NativeStatusBar.pushStackEntry(toNativeStackProps(props)),
    verticalBarBehaviorEntry,
  };
};

/**
 * Replace the props of an entry from `StatusBar.pushStackEntry()`. The entry keeps its place in
 * the stack.
 *
 * @param entry The entry to replace.
 * @param props The new props of the entry.
 * @return The new entry. Use it instead of the old entry.
 *
 * @example
 * ```ts
 * entry = StatusBar.replaceStackEntry(entry, { style: 'dark' });
 * ```
 */
StatusBar.replaceStackEntry = (
  entry: StatusBarStackEntry,
  props: StatusBarProps
): StatusBarStackEntry => {
  entry.verticalBarBehaviorEntry.behavior = props.verticalBarBehaviorIOS;
  updateVerticalBarBehavior();
  return {
    nativeEntry: NativeStatusBar.replaceStackEntry(entry.nativeEntry, toNativeStackProps(props)),
    verticalBarBehaviorEntry: entry.verticalBarBehaviorEntry,
  };
};

/**
 * Remove an entry from `StatusBar.pushStackEntry()` or `StatusBar.replaceStackEntry()`.
 *
 * @param entry The entry to remove.
 *
 * @example
 * ```ts
 * StatusBar.popStackEntry(entry);
 * ```
 */
StatusBar.popStackEntry = (entry: StatusBarStackEntry): void => {
  NativeStatusBar.popStackEntry(entry.nativeEntry);
  const index = verticalBarBehaviorStack.indexOf(entry.verticalBarBehaviorEntry);
  if (index !== -1) {
    verticalBarBehaviorStack.splice(index, 1);
  }
  updateVerticalBarBehavior();
};

/**
 * Get the edge where the system places the vertical bar, such as the side rail on iPhone Duo.
 * The edge stays the same while `verticalBarBehaviorIOS` is `'disabled'`.
 *
 * @return The edge of the vertical bar, or `null` when the system places no vertical bar, such as
 * on other devices, in orientations that keep the status bar at the top, or before iOS 27.1.
 * @platform ios
 *
 * @example
 * ```ts
 * StatusBar.getVerticalBarEdgeIOS(); // 'trailing' on iPhone Duo
 * ```
 */
StatusBar.getVerticalBarEdgeIOS = (): VerticalBarEdgeIOS | null =>
  ExpoStatusBar?.getVerticalBarEdge() ?? null;

/**
 * Set whether the system may move the status bar into a vertical bar beside the content, as on
 * iPhone Duo. Requires iOS 27.1 or later. A mounted `StatusBar` that sets `verticalBarBehaviorIOS`
 * takes priority over this value.
 *
 * @param behavior `'disabled'` keeps the status bar and system bars horizontal.
 * @platform ios
 *
 * @example
 * ```ts
 * StatusBar.setVerticalBarBehaviorIOS('disabled');
 * ```
 */
StatusBar.setVerticalBarBehaviorIOS = (behavior: VerticalBarBehaviorIOS): void => {
  defaultVerticalBarBehavior = behavior;
  updateVerticalBarBehavior();
};

/**
 * A hook that returns the edge where the system places the vertical bar, and updates when it
 * changes, such as when the device rotates. See `StatusBar.getVerticalBarEdgeIOS()`.
 * @platform ios
 */
export function useVerticalBarEdgeIOS(): VerticalBarEdgeIOS | null {
  return React.useSyncExternalStore(
    subscribeToVerticalBarEdge,
    getVerticalBarEdgeSnapshot,
    getVerticalBarEdgeSnapshot
  );
}

let cachedVerticalBarEdge: VerticalBarEdgeIOS | null | undefined;
let verticalBarEdgeSubscription: { remove(): void } | null = null;
const verticalBarEdgeListeners = new Set<() => void>();

function subscribeToVerticalBarEdge(listener: () => void): () => void {
  verticalBarEdgeListeners.add(listener);
  if (ExpoStatusBar && !verticalBarEdgeSubscription) {
    verticalBarEdgeSubscription = ExpoStatusBar.addListener('onVerticalBarEdgeChange', (event) => {
      cachedVerticalBarEdge = event.edge;
      verticalBarEdgeListeners.forEach((notify) => notify());
    });
    cachedVerticalBarEdge = undefined;
  }
  return () => {
    verticalBarEdgeListeners.delete(listener);
    if (verticalBarEdgeListeners.size === 0) {
      verticalBarEdgeSubscription?.remove();
      verticalBarEdgeSubscription = null;
      cachedVerticalBarEdge = undefined;
    }
  };
}

function getVerticalBarEdgeSnapshot(): VerticalBarEdgeIOS | null {
  if (cachedVerticalBarEdge === undefined) {
    cachedVerticalBarEdge = StatusBar.getVerticalBarEdgeIOS();
  }
  return cachedVerticalBarEdge;
}

function styleToBarStyle(
  style: StatusBarStyle = 'auto',
  colorScheme: ColorSchemeName = Appearance?.getColorScheme() ?? 'light'
): 'light-content' | 'dark-content' {
  if (!colorScheme) {
    colorScheme = 'light';
  }

  let resolvedStyle = style;
  if (style === 'auto') {
    resolvedStyle = colorScheme === 'light' ? 'dark' : 'light';
  } else if (style === 'inverted') {
    resolvedStyle = colorScheme === 'light' ? 'light' : 'dark';
  }

  return resolvedStyle === 'light' ? 'light-content' : 'dark-content';
}

function toNativeStackProps({
  style,
  animated,
  hidden,
  hideTransitionAnimation,
}: StatusBarProps): NativeStatusBarProps {
  return {
    barStyle: style === undefined ? undefined : styleToBarStyle(style),
    hidden,
    animated,
    showHideTransition: hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation,
  };
}
