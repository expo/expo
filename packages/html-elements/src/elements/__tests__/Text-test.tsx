import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import {
  B,
  BlockQuote,
  BR,
  Pre,
  Code,
  Del,
  EM,
  I,
  Mark,
  P,
  Q,
  S,
  Span,
  Strong,
  Time,
} from '../Text';

it('renders P', () => {
  const { toJSON } = render(<P>demo</P>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders B', () => {
  const { toJSON } = render(<B>demo</B>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Span', () => {
  const { toJSON } = render(<Span>demo</Span>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Strong', () => {
  const { toJSON } = render(<Strong>demo</Strong>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Del', () => {
  const { toJSON } = render(<Del>demo</Del>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders S', () => {
  const { toJSON } = render(<S>demo</S>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders I', () => {
  const { toJSON } = render(<I>demo</I>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders EM', () => {
  const { toJSON } = render(<EM>demo</EM>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders BR', () => {
  const { toJSON } = render(<BR />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Code', () => {
  const { toJSON } = render(<Code />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Q', () => {
  const { toJSON } = render(<Q>demo</Q>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders BlockQuote', () => {
  const { toJSON } = render(<BlockQuote />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Mark', () => {
  const { toJSON } = render(<Mark />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Time', () => {
  const { toJSON } = render(<Time dateTime="2001-05-15T19:00">May 15</Time>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Pre', () => {
  const { toJSON } = render(
    <Pre>{`
    body {
      color: red;
    }
  `}</Pre>
  );
  expect(toJSON()).toMatchSnapshot();
});
