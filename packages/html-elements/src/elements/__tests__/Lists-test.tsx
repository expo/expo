import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Ol, Li, UL } from '../Lists';

it(`renders UL nested in Ol`, () => {
  const tree = renderer.create(
    <Ol>
      <Li>item</Li>
      <UL>
        <Li>item</Li>
      </UL>
    </Ol>
  );
  expect(tree).toMatchSnapshot();
});
it(`renders Ol nested in UL`, () => {
  const tree = renderer.create(
    <UL>
      <Li>item</Li>
      <Ol>
        <Li>item</Li>
      </Ol>
    </UL>
  );
  expect(tree).toMatchSnapshot();
});
