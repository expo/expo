import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import * as React from 'react';

import { AppProviders, AppProvidersProps } from './providers/AppProviders';

export * from '@testing-library/react-native';

type AppProviderOptions = {
  initialAppProviderProps?: Partial<AppProvidersProps>;
};

export function render(
  component: React.ReactElement<any>,
  options: RenderOptions & AppProviderOptions = {}
) {
  const { initialAppProviderProps = {}, ...renderOptions } = options;

  return rtlRender(component, {
    ...renderOptions,
    wrapper: (props: any) => <AppProviders {...props} {...initialAppProviderProps} />,
  });
}

const mockFetch = global.fetch as jest.Mock;

export function mockFetchReturn(dataToReturn: any) {
  return mockFetch.mockResolvedValueOnce({ ok: true, json: () => dataToReturn });
}
