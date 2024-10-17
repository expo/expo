/*
 * This file is unchanged, except for moving eslint comments
 */
import * as React from 'react';

export function useThenable<T>(create: () => PromiseLike<T>) {
  const [promise] = React.useState(create);

  let initialState: [boolean, T | undefined] = [false, undefined];

  // Check if our thenable is synchronous
  promise.then((result) => {
    initialState = [true, result];
  });

  const [state, setState] = React.useState(initialState);
  const [resolved] = state;

  React.useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      let result;

      try {
        result = await promise;
      } finally {
        if (!cancelled) {
          setState([true, result]);
        }
      }
    };

    if (!resolved) {
      resolve();
    }

    return () => {
      cancelled = true;
    };
  }, [promise, resolved]);

  return state;
}
