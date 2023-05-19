import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';

const A = createMockComponent();

afterEach(() => {
  StyleSheet.__reset();
});

test('hover', () => {
  registerCSS(`.my-class:hover { width: 10px; }`);

  render(<A testID="a" className="my-class" />);

  expect(A).styleToEqual({});

  act(() => fireEvent(screen.getByTestId('a'), 'hoverIn', {}));

  expect(A).styleToEqual({ width: 10 });

  act(() => fireEvent(screen.getByTestId('a'), 'hoverOut', {}));

  expect(A).styleToEqual({});
});

test('active', () => {
  registerCSS(`.my-class:active { width: 10px; }`);

  render(<A testID="a" className="my-class" />);

  expect(A).styleToEqual({});

  act(() => fireEvent(screen.getByTestId('a'), 'PressIn', {}));

  expect(A).styleToEqual({ width: 10 });

  act(() => fireEvent(screen.getByTestId('a'), 'PressOut', {}));

  expect(A).styleToEqual({});
});

test('focus', () => {
  registerCSS(`.my-class:focus { width: 10px; }`);

  render(<A testID="a" className="my-class" />);

  expect(A).styleToEqual({});

  act(() => fireEvent(screen.getByTestId('a'), 'Focus', {}));

  expect(A).styleToEqual({ width: 10 });

  act(() => fireEvent(screen.getByTestId('a'), 'Blur', {}));

  expect(A).styleToEqual({});
});

test(':hover:active:focus', () => {
  registerCSS(`.my-class:hover:active:focus { width: 10px; }`);

  render(<A testID="a" className="my-class" />);

  expect(A).styleToEqual({});

  act(() => {
    fireEvent(screen.getByTestId('a'), 'hoverIn', {});
  });

  expect(A).styleToEqual({});

  act(() => {
    fireEvent(screen.getByTestId('a'), 'PressIn', {});
  });

  expect(A).styleToEqual({});

  act(() => {
    fireEvent(screen.getByTestId('a'), 'focus', {});
  });

  expect(A).styleToEqual({ width: 10 });

  act(() => fireEvent(screen.getByTestId('a'), 'hoverOut', {}));

  expect(A).styleToEqual({});
});
