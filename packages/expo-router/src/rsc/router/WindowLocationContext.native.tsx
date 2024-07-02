/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Emulates the window.location object on native.

import * as React from 'react';

import { extractExpoPathFromURL } from '../../fork/extractPathFromURL';
import { getInitialURL, addEventListener } from '../../link/linking';

const Location = React.createContext<{
  setHistory: (method: string, url: string | URL) => void;
}>({ setHistory: () => {} });

function coerceUrl(url: any) {
  if (typeof url === 'object' && 'pathname' in url) {
    return url as URL;
  }
  try {
    return new URL(url);
  } catch (e) {
    return new URL(url, 'http://localhost:8081');
  }
}
const setUrl = (url: string) => {
  const v = coerceUrl(url);
  globalThis.expoVirtualLocation = v;
};

export function LocationContext({ children }: { children: React.ReactElement }) {
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const v = await getInitialURL();

      setUrl(extractExpoPathFromURL(v));

      setLoaded(true);
    })();

    return addEventListener((url) => {
      setUrl(extractExpoPathFromURL(url));
    });
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <Location.Provider
      value={{
        setHistory(method, url) {
          if (method === 'pushState') {
            setUrl(url);
          } else {
            console.warn('Only pushState is supported atm');
          }
        },
      }}>
      {children}
    </Location.Provider>
  );
}

export function useVirtualLocation() {
  return React.useContext(Location);
}
