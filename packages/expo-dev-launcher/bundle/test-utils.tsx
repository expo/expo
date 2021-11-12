import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import * as React from 'react';
import { QueryClient } from 'react-query';

import { AppProviders } from './components/AppProviders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }) => <AppProviders queryClient={queryClient}>{children}</AppProviders>;

export * from '@testing-library/react-native';

export function render(component: React.ReactElement<any>, options?: RenderOptions) {
  return rtlRender(component, { wrapper, ...options });
}
