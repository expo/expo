import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { createMockComponent, registerCSS } from './utils';
import { StyleSheet } from '../runtime/native/stylesheet';

const A = createMockComponent();

afterEach(() => {
  StyleSheet.__reset();
});

test('inline variable', () => {
  registerCSS(`.my-class { width: var(--my-var); --my-var: 10px; }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({
    width: 10,
  });
});

test('combined inline variable', () => {
  registerCSS(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);

  render(<A className="my-class-1 my-class-2" />);

  expect(A).styleToEqual({
    width: 10,
  });

  // Prove that the order doesn't matter
  screen.rerender(<A className="my-class-3 my-class-1" />);

  expect(A).styleToEqual({
    width: 20,
  });
});

test('inherit variables', () => {
  const B = createMockComponent();

  registerCSS(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);

  render(
    <A className="my-class-2">
      <B className="my-class-1" />
    </A>
  );

  expect(A).styleToEqual({});
  expect(B).styleToEqual({ width: 10 });

  screen.rerender(
    <A className="my-class-3">
      <B className="my-class-1" />
    </A>
  );

  expect(A).styleToEqual({});
  expect(B).styleToEqual({ width: 20 });
});
