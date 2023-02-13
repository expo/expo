import React from 'react';
import renderer from 'react-test-renderer';

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

it(`strips invalid style properties`, () => {
  const tree = renderer.create(
    <Safe
      style={{
        transitionDuration: '200ms',
        position: 'absolute',
      }}
    />
  );
  //   expect(tree.root.children[0]).toHaveStyle({ position: 'absolute' });
  expect(tree).toMatchSnapshot();
});

it(`replaces invalid position with "relative"`, () => {
  const tree = renderer.create(
    <Safe
      style={{
        position: 'fixed',
      }}
    />
  );
  expect(tree).toMatchSnapshot();
  expect(console.warn).toBeCalledWith(`Unsupported position: 'fixed'`);
});

it(`mocks out visibility: hidden by lowering the opacity`, () => {
  const tree = renderer.create(
    <Safe
      style={{
        visibility: 'hidden',
      }}
    />
  );
  expect(tree).toMatchSnapshot();
});
