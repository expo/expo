'use client';
// A fork of `useFocusEffect` that waits for the navigation state to load before
// running the effect. This is especially useful for native redirects.
import * as React from 'react';

import { useOptionalNavigation } from './link/useLoadedNavigation';

/**
 * Memoized callback containing the effect, should optionally return a cleanup function.
 */
export type EffectCallback = () => undefined | void | (() => void);

/**
 * Hook to run an effect whenever a route is **focused**. Similar to [`React.useEffect`](https://react.dev/reference/react/useEffect).
 *
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in [`React.useCallback`](https://react.dev/reference/react/useCallback) to avoid running the effect too often.
 *
 * @example
 * ```tsx
 * import { useFocusEffect } from 'expo-router';
 * import { useCallback } from 'react';
 *
 * export default function Route() {
 *   useFocusEffect(
 *     // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *     useCallback(() => {
 *       // Invoked whenever the route is focused.
 *       console.log('Hello, I'm focused!');
 *
 *       // Return function is invoked whenever the route gets out of focus.
 *       return () => {
 *         console.log('This route is now unfocused.');
 *       };
 *     }, []);
 *    );
 *
 *  return </>;
 * }
 *```
 *
 * @param effect Memoized callback containing the effect, should optionally return a cleanup function.
 * @param do_not_pass_a_second_prop
 */
export function useFocusEffect(effect: EffectCallback, do_not_pass_a_second_prop?: never) {
  const navigation = useOptionalNavigation();

  if (do_not_pass_a_second_prop !== undefined) {
    const message =
      "You passed a second argument to 'useFocusEffect', but it only accepts one argument. " +
      "If you want to pass a dependency array, you can use 'React.useCallback':\n\n" +
      'useFocusEffect(\n' +
      '  React.useCallback(() => {\n' +
      '    // Your code here\n' +
      '  }, [depA, depB])\n' +
      ');\n\n' +
      'See usage guide: https://reactnavigation.org/docs/use-focus-effect';

    console.error(message);
  }

  React.useEffect(() => {
    if (!navigation) {
      return;
    }

    let isFocused = false;
    let cleanup: undefined | void | (() => void);

    const callback = () => {
      const destroy = effect();

      if (destroy === undefined || typeof destroy === 'function') {
        return destroy;
      }

      if (process.env.NODE_ENV !== 'production') {
        let message =
          'An effect function must not return anything besides a function, which is used for clean-up.';

        if (destroy === null) {
          message +=
            " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
        } else if (typeof (destroy as any).then === 'function') {
          message +=
            "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " +
            'Instead, write the async function inside your effect ' +
            'and call it immediately:\n\n' +
            'useFocusEffect(\n' +
            '  React.useCallback(() => {\n' +
            '    async function fetchData() {\n' +
            '      // You can await here\n' +
            '      const response = await MyAPI.getData(someId);\n' +
            '      // ...\n' +
            '    }\n\n' +
            '    fetchData();\n' +
            '  }, [someId])\n' +
            ');\n\n' +
            'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        } else {
          message += ` You returned '${JSON.stringify(destroy)}'.`;
        }

        console.error(message);
      }
    };

    // We need to run the effect on initial render/dep changes if the screen is focused
    if (navigation.isFocused()) {
      cleanup = callback();
      isFocused = true;
    }

    const unsubscribeFocus = navigation.addListener('focus', () => {
      // If callback was already called for focus, avoid calling it again
      // The focus event may also fire on initial render, so we guard against running the effect twice
      if (isFocused) {
        return;
      }

      if (cleanup !== undefined) {
        cleanup();
      }

      cleanup = callback();
      isFocused = true;
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (cleanup !== undefined) {
        cleanup();
      }

      cleanup = undefined;
      isFocused = false;
    });

    return () => {
      if (cleanup !== undefined) {
        cleanup();
      }

      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [effect, navigation]);
}
