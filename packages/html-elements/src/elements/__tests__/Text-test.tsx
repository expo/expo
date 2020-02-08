import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { B, BR, Code, Em, I, Mark, P, S, Small, Del, Strong } from '../Text';

it(`renders P`, () => {
  const tree = renderer.create(<P>demo</P>);
  expect(tree).toMatchSnapshot();
});
it(`renders B`, () => {
  const tree = renderer.create(<B>demo</B>);
  expect(tree).toMatchSnapshot();
});
it(`renders Strong`, () => {
  const tree = renderer.create(<Strong>demo</Strong>);
  expect(tree).toMatchSnapshot();
});
it(`renders Del`, () => {
  const tree = renderer.create(<Del>demo</Del>);
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
it(`renders Em`, () => {
  const tree = renderer.create(<Em>demo</Em>);
  expect(tree).toMatchSnapshot();
});
it(`renders BR`, () => {
  const tree = renderer.create(<BR />);
  expect(tree).toMatchSnapshot();
});
it(`renders Code`, () => {
  const tree = renderer.create(<Code />);
  expect(tree).toMatchSnapshot();
});
it(`renders Mark`, () => {
  const tree = renderer.create(<Mark />);
  expect(tree).toMatchSnapshot();
});
it(`renders Small`, () => {
  const tree = renderer.create(<Small />);
  expect(tree).toMatchSnapshot();
});
