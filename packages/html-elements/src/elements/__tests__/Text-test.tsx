import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { P, B, I, S } from '../Text';

it(`renders P`, () => {
  const tree = renderer.create(<P>demo</P>);
  expect(tree).toMatchSnapshot();
});
it(`renders B`, () => {
  const tree = renderer.create(<B>demo</B>);
  expect(tree).toMatchSnapshot();
});
it(`renders S`, () => {
  const tree = renderer.create(<S>demo</S>);
  expect(tree).toMatchSnapshot();
});
it(`renders I`, () => {
  const tree = renderer.create(<I>demo</I>);
  expect(tree).toMatchSnapshot();
});
