import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Table, THead, Tbody, Tfoot, Tr, Th, Td, Caption } from '../Table';

it(`renders Table`, () => {
  const tree = renderer.create(<Table />);
  expect(tree).toMatchSnapshot();
});
it(`renders THead`, () => {
  const tree = renderer.create(<THead />);
  expect(tree).toMatchSnapshot();
});
it(`renders Tbody`, () => {
  const tree = renderer.create(<Tbody />);
  expect(tree).toMatchSnapshot();
});
it(`renders Tfoot`, () => {
  const tree = renderer.create(<Tfoot />);
  expect(tree).toMatchSnapshot();
});
it(`renders Th`, () => {
  const tree = renderer.create(<Th>Header</Th>);
  expect(tree).toMatchSnapshot();
});
it(`renders Tr`, () => {
  const tree = renderer.create(<Tr />);
  expect(tree).toMatchSnapshot();
});
it(`renders Td`, () => {
  const tree = renderer.create(<Td>Column</Td>);
  expect(tree).toMatchSnapshot();
});
it(`renders Caption`, () => {
  const tree = renderer.create(<Caption>Caption</Caption>);
  expect(tree).toMatchSnapshot();
});
