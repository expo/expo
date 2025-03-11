import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { Table, THead, TBody, TFoot, TR, TH, TD, Caption } from '../Table';

it('renders Table', () => {
  const { toJSON } = render(<Table />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders THead', () => {
  const { toJSON } = render(<THead />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TBody', () => {
  const { toJSON } = render(<TBody />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TFoot', () => {
  const { toJSON } = render(<TFoot />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TH', () => {
  const { toJSON } = render(<TH>Header</TH>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TR', () => {
  const { toJSON } = render(<TR />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TD', () => {
  const { toJSON } = render(<TD>Column</TD>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Caption', () => {
  const { toJSON } = render(<Caption>Caption</Caption>);
  expect(toJSON()).toMatchSnapshot();
});
