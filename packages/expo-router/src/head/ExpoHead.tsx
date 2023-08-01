import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export const Head: React.FC<{ children?: React.ReactNode }> & {
  Provider: typeof HelmetProvider;
} = ({ children }: { children?: any }) => {
  return <Helmet>{children}</Helmet>;
};

Head.Provider = HelmetProvider;
