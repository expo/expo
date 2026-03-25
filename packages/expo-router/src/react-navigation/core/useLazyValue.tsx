import * as React from 'react';

export function useLazyValue<T>(create: () => T) {
  const lazyRef = React.useRef<T>(undefined);

  if (lazyRef.current === undefined) {
    lazyRef.current = create();
  }

  return lazyRef.current as T;
}
