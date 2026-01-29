import { useIsFocused } from '@react-navigation/native';
import React from 'react';

import { Helmet, HelmetProvider } from '../../vendor/react-helmet-async/lib';

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
  return <FocusedHelmet>{children}</FocusedHelmet>;
};

Head.Provider = HelmetProvider;
