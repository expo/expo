import * as React from 'react';

// ref: https://usehooks-ts.com/react-hook/use-is-mounted
export function useIsMounted() {
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return React.useCallback(() => isMounted.current, []);
}
