import { act, render } from '@testing-library/react-native';
import React from 'react';

import { rem, vh, vw } from '../runtime/native/globals';
import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';

const A = createMockComponent();

afterEach(() => {
  StyleSheet.__reset();
});

test('px', () => {
  registerCSS(`.my-class { width: 10px; }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({
    width: 10,
  });
});

test('%', () => {
  registerCSS(`.my-class { width: 10%; }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({
    width: '10%',
  });
});

test('vw', () => {
  registerCSS(`.my-class { width: 10vw; }`);

  render(<A className="my-class" />);

  expect(vw.get()).toEqual(750);
  expect(A).styleToEqual({
    width: 75,
  });

  act(() => {
    vw.__set(100);
  });

  expect(vw.get()).toEqual(100);
  expect(A).styleToEqual({ width: 10 });
});

test('vh', () => {
  registerCSS(`.my-class { height: 10vh; }`);

  render(<A className="my-class" />);

  expect(vh.get()).toEqual(1334);
  expect(A).styleToEqual({ height: 133.4 });

  act(() => {
    vh.__set(100);
  });

  expect(vh.get()).toEqual(100);
  expect(A).styleToEqual({ height: 10 });
});

test('rem - default', () => {
  registerCSS(`.my-class { fontSize: 10rem; }`);

  render(<A className="my-class" />);

  expect(A).styleToEqual({ fontSize: 140 });
});

test('rem - override', () => {
  registerCSS(`.my-class { fontSize: 10rem; }`, {
    inlineRem: 10,
  });

  render(<A className="my-class" />);

  expect(A).styleToEqual({ fontSize: 100 });
});

test('rem - dynamic', () => {
  registerCSS(`.my-class { fontSize: 10rem; }`, {
    inlineRem: false,
  });

  render(<A className="my-class" />);

  expect(rem.get()).toEqual(14);
  expect(A).styleToEqual({ fontSize: 140 });

  act(() => {
    rem.set(10);
  });

  expect(rem.get()).toEqual(10);
  expect(A).styleToEqual({ fontSize: 100 });
});
