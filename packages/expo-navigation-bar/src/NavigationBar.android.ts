import type { EventSubscription } from 'expo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import ExpoNavigationBar from './ExpoNavigationBar';
import type {
  NavigationBarProps,
  NavigationBarStyle,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

type ResolvedBarStyle = 'light' | 'dark';

function isLightColorScheme() {
  const colorScheme = Appearance?.getColorScheme() ?? 'light';
  return colorScheme === 'light';
}

function resolveStyle(style: NavigationBarStyle): ResolvedBarStyle {
  switch (style) {
    case 'auto':
      return isLightColorScheme() ? 'dark' : 'light';
    case 'inverted':
      return isLightColorScheme() ? 'light' : 'dark';
    default:
      return style;
  }
}

// Matches built-in StatusBar defaultProps
const defaultProps: Required<NavigationBarProps> = {
  style: 'light',
  hidden: false,
};

// Merges the entries stack over the default values, so that a key that no mounted entry
// specifies falls back to the default instead of being left at whatever was applied last.
function mergeEntriesStack(
  entriesStack: NavigationBarProps[],
  defaultValues: Required<NavigationBarProps>
): Required<NavigationBarProps> {
  return entriesStack.reduce<Required<NavigationBarProps>>(
    (prev, cur) => ({
      style: cur.style ?? prev.style,
      hidden: cur.hidden ?? prev.hidden,
    }),
    { ...defaultValues }
  );
}

// Returns an object to insert in the props stack from the props
function createStackEntry({ style, hidden }: NavigationBarProps): NavigationBarProps {
  return { style, hidden }; // Create a copy
}

const entriesStack: NavigationBarProps[] = [];

// Timer for updating the native module values at the end of the frame
let updateImmediate: ReturnType<typeof setImmediate> | null = null;

// The current merged values from the entries stack
const currentValues: {
  style: ResolvedBarStyle | undefined;
  hidden: boolean | undefined;
} = {
  style: undefined,
  hidden: undefined,
};

// Applies the values to the native module. These must not touch `defaultProps`, otherwise
// mounting a component would overwrite the defaults that seed the merge.
function applyStyle(style: NavigationBarStyle) {
  const resolvedStyle = resolveStyle(style);

  if (resolvedStyle !== currentValues.style) {
    currentValues.style = resolvedStyle;
    ExpoNavigationBar.setStyle(resolvedStyle).catch(() => {});
  }
}

function applyHidden(hidden: boolean) {
  if (hidden !== currentValues.hidden) {
    currentValues.hidden = hidden;
    ExpoNavigationBar.setHidden(hidden).catch(() => {});
  }
}

export function setStyle(style: NavigationBarStyle) {
  defaultProps.style = style;
  applyStyle(style);
}

function setHidden(hidden: boolean) {
  defaultProps.hidden = hidden;
  applyHidden(hidden);
}

// Updates the native navigation bar with the entries from the stack
function updateEntriesStack() {
  if (updateImmediate != null) {
    clearImmediate(updateImmediate);
  }

  updateImmediate = setImmediate(() => {
    const { style, hidden } = mergeEntriesStack(entriesStack, defaultProps);

    applyStyle(style);
    applyHidden(hidden);
  });
}

function pushStackEntry(props: NavigationBarProps): NavigationBarProps {
  const entry = createStackEntry(props);
  entriesStack.push(entry);
  updateEntriesStack();
  return entry;
}

function popStackEntry(entry: NavigationBarProps): void {
  const index = entriesStack.indexOf(entry);
  if (index !== -1) {
    entriesStack.splice(index, 1);
  }
  updateEntriesStack();
}

function replaceStackEntry(
  entry: NavigationBarProps,
  props: NavigationBarProps
): NavigationBarProps {
  const newEntry = createStackEntry(props);
  const index = entriesStack.indexOf(entry);
  if (index !== -1) {
    entriesStack[index] = newEntry;
  }
  updateEntriesStack();
  return newEntry;
}

export function NavigationBar({ style, hidden }: NavigationBarProps) {
  const colorScheme = useColorScheme();
  const stableProps = useMemo<NavigationBarProps>(() => ({ style, hidden }), [style, hidden]);
  const stackEntryRef = useRef<NavigationBarProps | null>(null);

  useEffect(() => {
    // Every time a NavigationBar component is mounted, we push its prop to a stack
    // and always update the native navigation bar with the props from the top of the
    // stack. This allows having multiple NavigationBar components and the one that is
    // added last or is deeper in the view hierarchy will have priority.
    stackEntryRef.current = pushStackEntry(stableProps);

    return () => {
      // When a NavigationBar is unmounted, remove itself from the stack and update
      // the native bar with the next props.
      if (stackEntryRef.current) {
        popStackEntry(stackEntryRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stackEntryRef.current) {
      stackEntryRef.current = replaceStackEntry(stackEntryRef.current, stableProps);
    }
  }, [colorScheme, stableProps]);

  return null;
}

NavigationBar.setStyle = setStyle;
NavigationBar.setHidden = setHidden;

export function addVisibilityListener(
  listener: (event: NavigationBarVisibilityEvent) => void
): EventSubscription {
  return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}

export async function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  await ExpoNavigationBar.setHidden(visibility === 'hidden');
}

export async function getVisibilityAsync(): Promise<NavigationBarVisibility> {
  return ExpoNavigationBar.getVisibilityAsync();
}

export function useVisibility(): NavigationBarVisibility | null {
  const [visibility, setVisible] = useState<NavigationBarVisibility | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVisibilityAsync().then((visibility) => {
      if (isMounted) {
        setVisible(visibility);
      }
    });

    const listener = addVisibilityListener(({ visibility }) => {
      if (isMounted) {
        setVisible(visibility);
      }
    });

    return () => {
      listener.remove();
      isMounted = false;
    };
  }, []);

  return visibility;
}
