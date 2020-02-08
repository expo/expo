import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Ol, Li, Ul } from '../Lists';

it(`renders Ul nested in Ol`, () => {
  const tree = renderer.create(
    <Ol>
      <Li>item</Li>
      <Ul>
        <Li>item</Li>
      </Ul>
    </Ol>
  );
  expect(tree).toMatchSnapshot();
});
it(`renders Ol nested in Ul`, () => {
  const tree = renderer.create(
    <Ul>
      <Li>item</Li>
      <Ol>
        <Li>item</Li>
      </Ol>
    </Ul>
  );
  expect(tree).toMatchSnapshot();
});
