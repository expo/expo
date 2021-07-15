import * as React from 'react';

export function useResolvedValue<T>(
  method: () => Promise<T>,
  deps?: React.DependencyList
): [T | null, Error | null] {
  const [error, setError] = React.useState<Error | null>(null);
  const [value, setValue] = React.useState<T | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    method()
      .then(value => {
        if (isMounted) {
          setValue(value);
        }
      })
      .catch(error => {
        if (isMounted) {
          setError(error);
        }
      });
    return () => {
      isMounted = false;
    };
  }, deps);

  return [value, error];
}
