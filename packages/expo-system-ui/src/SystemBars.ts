import React from 'react';
import { Appearance, Platform, StatusBar, useColorScheme } from 'react-native';

import ExpoSystemUI, { SystemBarsConfig } from './ExpoSystemUI';

export type SystemBarStyle = 'auto' | 'light' | 'dark';

export type SystemBarsProps = {
  statusBarStyle?: SystemBarStyle;
  statusBarHidden?: boolean;
  navigationBarHidden?: boolean;
};

function getColorScheme(): 'light' | 'dark' {
  return Appearance?.getColorScheme() ?? 'light';
}

/**
 * Merges the props stack.
 */
function mergePropsStack(propsStack: SystemBarsProps[]): SystemBarsProps | null {
  const mergedEntry = propsStack.reduce<SystemBarsProps>(
    (prev, cur) => {
      for (const prop in cur) {
        if (cur[prop] != null) {
          prev[prop] = cur[prop];
        }
      }
      return prev;
    },
    {
      statusBarStyle: undefined,
      statusBarHidden: undefined,
      navigationBarHidden: undefined,
    }
  );

  if (
    mergedEntry.statusBarStyle == null &&
    mergedEntry.statusBarHidden == null &&
    mergedEntry.navigationBarHidden == null
  ) {
    return null;
  } else {
    return mergedEntry;
  }
}

const propsStack: SystemBarsProps[] = [];

// Timer for updating the native module values at the end of the frame.
let updateImmediate: number | null = null;

// The current merged values from the props stack.
let currentMergedProps: SystemBarsProps | null = null;

/**
 * Updates the native system bars with the props from the stack.
 */
function updatePropsStack() {
  if (updateImmediate != null) {
    clearImmediate(updateImmediate);
  }

  updateImmediate = setImmediate(() => {
    const prevMergedProps = currentMergedProps;
    const mergedProps = mergePropsStack(propsStack);

    if (mergedProps != null) {
      if (
        prevMergedProps?.statusBarStyle !== mergedProps.statusBarStyle ||
        prevMergedProps?.statusBarHidden !== mergedProps.statusBarHidden ||
        prevMergedProps?.navigationBarHidden !== mergedProps.navigationBarHidden
      ) {
        const { statusBarHidden, navigationBarHidden } = mergedProps;

        const statusBarStyle: SystemBarsConfig['statusBarStyle'] =
          mergedProps.statusBarStyle === 'auto'
            ? getColorScheme() === 'light'
              ? 'dark'
              : 'light'
            : mergedProps.statusBarStyle;

        if (Platform.OS === 'android') {
          ExpoSystemUI.setSystemBarsConfigAsync({
            statusBarStyle,
            statusBarHidden,
            navigationBarHidden,
          });
        } else {
          // Emulate android behavior with react-native StatusBar
          if (statusBarStyle != null) {
            StatusBar.setBarStyle(`${statusBarStyle}-content`, true);
          }
          if (statusBarHidden != null) {
            StatusBar.setHidden(statusBarHidden, 'fade'); // 'slide' doesn't work in this context
          }
        }
      }

      currentMergedProps = mergedProps;
    } else {
      currentMergedProps = null;
    }
  });
}

/**
 * Push a SystemBars entry onto the stack.
 * The return value should be passed to `popStackEntry` when complete.
 *
 * @param props Object containing the SystemBars props to use in the stack entry.
 */
function pushStackEntry(props: SystemBarsProps): SystemBarsProps {
  const copy = { ...props };
  propsStack.push(copy);
  updatePropsStack();
  return copy;
}

/**
 * Pop a SystemBars entry from the stack.
 *
 * @param entry Entry returned from `pushStackEntry`.
 */
function popStackEntry(entry: SystemBarsProps): void {
  const index = propsStack.indexOf(entry);
  if (index !== -1) {
    propsStack.splice(index, 1);
  }
  updatePropsStack();
}

/**
 * Replace an existing SystemBars stack entry with new props.
 *
 * @param entry Entry returned from `pushStackEntry` to replace.
 * @param props Object containing the SystemBars props to use in the replacement stack entry.
 */
function replaceStackEntry(entry: SystemBarsProps, props: SystemBarsProps): SystemBarsProps {
  const copy = { ...props };
  const index = propsStack.indexOf(entry);
  if (index !== -1) {
    propsStack[index] = copy;
  }
  updatePropsStack();
  return copy;
}

export function SystemBars({
  statusBarStyle,
  statusBarHidden,
  navigationBarHidden,
}: SystemBarsProps) {
  const stableProps = React.useMemo(
    () => ({
      statusBarStyle,
      statusBarHidden,
      navigationBarHidden,
    }),
    [statusBarStyle, statusBarHidden, navigationBarHidden]
  );

  const colorScheme = useColorScheme();
  const stackEntryRef = React.useRef<SystemBarsProps | null>(null);

  React.useEffect(() => {
    // Every time a SystemBars component is mounted, we push it's prop to a stack
    // and always update the native system bars with the props from the top of then
    // stack. This allows having multiple SystemBars components and the one that is
    // added last or is deeper in the view hierarchy will have priority.
    stackEntryRef.current = pushStackEntry(stableProps);

    return () => {
      // When a SystemBars is unmounted, remove itself from the stack and update
      // the native bars with the next props.
      if (stackEntryRef.current) {
        popStackEntry(stackEntryRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (stackEntryRef.current) {
      stackEntryRef.current = replaceStackEntry(stackEntryRef.current, stableProps);
    }
  }, [colorScheme, stableProps]);

  return null;
}

SystemBars.pushStackEntry = pushStackEntry;
SystemBars.popStackEntry = popStackEntry;
SystemBars.replaceStackEntry = replaceStackEntry;
