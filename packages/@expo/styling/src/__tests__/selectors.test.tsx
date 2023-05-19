import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { StyleSheet } from '../runtime/native/stylesheet';
import { createMockComponent, registerCSS } from './utils';

afterEach(() => {
  StyleSheet.__reset();
});

test('group', async () => {
  const A = createMockComponent();
  const B = createMockComponent();

  registerCSS(
    `.group\\/item .my-class { 
      color: red;
    }`,
    {
      grouping: ['^group\\/.*'],
    }
  );

  const { rerender } = render(<B className="my-class" />);

  expect(B).styleToEqual({});

  rerender(
    <A testID="A" className="group/item">
      <B className="my-class" />
    </A>
  );

  expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});

test('invalid group', async () => {
  const A = createMockComponent();
  const B = createMockComponent();

  registerCSS(
    `.invalid .my-class { 
      color: red;
    }`,
    {
      grouping: ['^group\\/.*'],
    }
  );

  const { rerender } = render(<B className="my-class" />);

  expect(B).styleToEqual(undefined);

  rerender(
    <A testID="A" className="invalid">
      <B className="my-class" />
    </A>
  );

  expect(B).styleToEqual(undefined);
});

test('multiple groups', async () => {
  const A = createMockComponent();
  const B = createMockComponent();

  registerCSS(
    `.valid .my-class { 
      color: red;
    }`,
    {
      grouping: ['^group\\/.*', '^valid'],
    }
  );

  const { rerender } = render(<B className="my-class" />);

  expect(B).styleToEqual({});

  rerender(
    <A testID="A" className="valid">
      <B className="my-class" />
    </A>
  );

  expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});

test('groups - pseudo classes', async () => {
  const A = createMockComponent();
  const B = createMockComponent();

  registerCSS(
    `.btn:active .btn-text { 
      color: red;
    }`,
    {
      grouping: ['^btn$'],
    }
  );

  const { findByTestId } = render(
    <A testID="A" className="btn">
      <B className="btn-text" />
    </A>
  );

  const aComponent = await findByTestId('A');

  expect(B).styleToEqual({});

  fireEvent(aComponent, 'pressIn');

  expect(B).styleToEqual({ color: 'rgba(255, 0, 0, 1)' });
});
