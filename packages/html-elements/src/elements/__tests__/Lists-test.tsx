import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { OL, LI, UL } from '../Lists';

it(`renders UL nested in OL`, () => {
  const tree = renderer.create(
    <OL>
      <LI>item</LI>
      <UL>
        <LI>item</LI>
      </UL>
    </OL>
  );
  expect(tree).toMatchSnapshot();
});
it(`renders OL nested in UL`, () => {
  const tree = renderer.create(
    <UL>
      <LI>item</LI>
      <OL>
        <LI>item</LI>
      </OL>
    </UL>
  );
  expect(tree).toMatchSnapshot();
});
