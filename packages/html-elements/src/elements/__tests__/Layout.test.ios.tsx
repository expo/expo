import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { Article, Aside, Footer, Header, Main, Nav, Section } from '../Layout';

it('renders Footer', () => {
  const { toJSON } = render(<Footer />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Nav', () => {
  const { toJSON } = render(<Nav />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Aside', () => {
  const { toJSON } = render(<Aside />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Header', () => {
  const { toJSON } = render(<Header />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Main', () => {
  const { toJSON } = render(<Main />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Section', () => {
  const { toJSON } = render(<Section />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Article', () => {
  const { toJSON } = render(<Article />);
  expect(toJSON()).toMatchSnapshot();
});
