import React from 'react';

import { Helmet, HelmetProvider } from '../vendor/react-helmet-async/lib';

export const Head: React.FC<{ children?: React.ReactNode }> & {
  Provider: typeof HelmetProvider;
} = ({ children }: { children?: any }) => {
  return <Helmet>{children}</Helmet>;
};

Head.Provider = HelmetProvider;
