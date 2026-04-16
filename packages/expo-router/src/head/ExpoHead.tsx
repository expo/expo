import React from 'react';
import Constants from 'expo-constants';

import { Helmet, HelmetProvider } from '../../vendor/react-helmet-async/lib';
import { useIsFocused } from '../useIsFocused';

function FocusedHelmet({ children }: { children?: React.ReactNode }) {
  return <Helmet>{children}</Helmet>;
}

export const Head: React.FC<{ children?: React.ReactNode }> & {
  Provider: typeof HelmetProvider;
} = ({ children }: { children?: React.ReactNode }) => {
  const isFocused = useIsFocused();
  if (!isFocused) {
    return null;
  }

  const manifest = Constants.expoConfig;
  if (manifest) {
    if (__DEV__ && manifest.extra?.router?.unstable_useServerRendering) {
      console.warn(
        '<Head> is not supported when server rendering is enabled. Use `generateMetadata()` to generate page metadata instead'
      );
    }
  }

  return <FocusedHelmet>{children}</FocusedHelmet>;
};

Head.Provider = HelmetProvider;
