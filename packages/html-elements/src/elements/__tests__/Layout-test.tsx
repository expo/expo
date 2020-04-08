import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Article, Aside, Footer, Header, Main, Nav, Section } from '../Layout';

it(`renders Footer`, () => {
  const tree = renderer.create(<Footer />);
  expect(tree).toMatchSnapshot();
});

it(`renders Nav`, () => {
  const tree = renderer.create(<Nav />);
  expect(tree).toMatchSnapshot();
});

it(`renders Aside`, () => {
  const tree = renderer.create(<Aside />);
  expect(tree).toMatchSnapshot();
});

it(`renders Header`, () => {
  const tree = renderer.create(<Header />);
  expect(tree).toMatchSnapshot();
});

it(`renders Main`, () => {
  const tree = renderer.create(<Main />);
  expect(tree).toMatchSnapshot();
});

it(`renders Section`, () => {
  const tree = renderer.create(<Section />);
  expect(tree).toMatchSnapshot();
});

it(`renders Article`, () => {
  const tree = renderer.create(<Article />);
  expect(tree).toMatchSnapshot();
});
