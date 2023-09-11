import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

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

it(`renders P`, () => {
  const tree = renderer.create(<P>demo</P>);
  expect(tree).toMatchSnapshot();
});
it(`renders B`, () => {
  const tree = renderer.create(<B>demo</B>);
  expect(tree).toMatchSnapshot();
});
it(`renders Span`, () => {
  const tree = renderer.create(<Span>demo</Span>);
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
it(`renders EM`, () => {
  const tree = renderer.create(<EM>demo</EM>);
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
it(`renders Q`, () => {
  const tree = renderer.create(<Q>demo</Q>);
  expect(tree).toMatchSnapshot();
});
it(`renders BlockQuote`, () => {
  const tree = renderer.create(<BlockQuote />);
  expect(tree).toMatchSnapshot();
});
it(`renders Mark`, () => {
  const tree = renderer.create(<Mark />);
  expect(tree).toMatchSnapshot();
});
it(`renders Time`, () => {
  const tree = renderer.create(<Time dateTime="2001-05-15T19:00">May 15</Time>);
  expect(tree).toMatchSnapshot();
});
it(`renders Pre`, () => {
  const tree = renderer.create(
    <Pre>{`
    body {
      color: red;
    }
  `}</Pre>
  );
  expect(tree).toMatchSnapshot();
});
