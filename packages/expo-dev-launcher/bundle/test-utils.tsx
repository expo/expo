import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import * as React from 'react';

import { apiClient } from './apiClient';
import { AppProviders, AppProvidersProps } from './providers/AppProviders';

export * from '@testing-library/react-native';

type AppProviderOptions = {
  initialAppProviderProps?: Partial<AppProvidersProps>;
};

export function render(
  component: React.ReactElement,
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
  return mockFetch.mockResolvedValue({ ok: true, json: () => dataToReturn });
}

export function mockGraphQLResponse<T>(data: T) {
  const request = apiClient.request as jest.Mock;
  return request.mockResolvedValue(data);
}
