import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { Article, Aside, Footer, Header, Main, Nav, Section } from '../Layout';

it('renders Footer', () => {
  render(<Footer />);

  const footer = screen.getByRole('contentinfo');
  expect(footer).toBeDefined();
});

it('renders Nav', () => {
  render(<Nav />);

  const nav = screen.getByRole('navigation');
  expect(nav).toBeDefined();
});

it('renders Aside', () => {
  render(<Aside />);

  const aside = screen.getByRole('complementary');
  expect(aside).toBeDefined();
});

it('renders Header', () => {
  render(<Header />);

  const header = screen.getByRole('banner');
  expect(header).toBeDefined();
});

it('renders Main', () => {
  render(<Main />);
  const main = screen.getByRole('main');
  expect(main).toBeDefined();
});

it('renders Section', () => {
  render(<Section />);
  const section = screen.getByRole('region');
  expect(section).toBeDefined();
});

it('renders Article', () => {
  render(<Article />);
  const article = screen.getByRole('article');
  expect(article).toBeDefined();
});
