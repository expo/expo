import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { OL, Li, UL } from '../Lists';

it(`renders UL nested in OL`, () => {
  const tree = renderer.create(
    <OL>
      <Li>item</Li>
      <UL>
        <Li>item</Li>
      </UL>
    </OL>
  );
  expect(tree).toMatchSnapshot();
});
it(`renders OL nested in UL`, () => {
  const tree = renderer.create(
    <UL>
      <Li>item</Li>
      <OL>
        <Li>item</Li>
      </OL>
    </UL>
  );
  expect(tree).toMatchSnapshot();
});
