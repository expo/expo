import { render } from '@testing-library/react-native';
import * as React from 'react';

import View from '../../primitives/View';
import { createSafeStyledView } from '../createSafeStyledView';

const Safe = createSafeStyledView(View);

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

it('strips invalid style properties', () => {
  const { toJSON } = render(
    <Safe
      style={{
        transitionDuration: '200ms',
        position: 'absolute',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
});

it('replaces invalid position with "relative"', () => {
  const { toJSON } = render(
    <Safe
      style={{
        position: 'fixed',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
  expect(console.warn).toHaveBeenCalledWith(`Unsupported position: 'fixed'`);
});

it('mocks out visibility: hidden by lowering the opacity', () => {
  const { toJSON } = render(
    <Safe
      style={{
        visibility: 'hidden',
      }}
    />
  );
  expect(toJSON()).toMatchSnapshot();
});
