import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import * as React from 'react';

import { AppProviders } from './components/AppProviders';

const wrapper = ({ children }) => <AppProviders>{children}</AppProviders>;

export * from '@testing-library/react-native';

export function render(component: React.ReactElement<any>, options?: RenderOptions) {
  return rtlRender(component, { wrapper, ...options });
}
