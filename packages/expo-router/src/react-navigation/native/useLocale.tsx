import * as React from 'react';

import { LocaleDirContext } from './LocaleDirContext';

/**
 * Hook to access the text direction specified in the `NavigationContainer`.
 */
export function useLocale() {
  const direction = React.useContext(LocaleDirContext);

  if (direction === undefined) {
    throw new Error(
      "Couldn't determine the text direction. Is your component inside NavigationContainer?"
    );
  }

  return { direction };
}
