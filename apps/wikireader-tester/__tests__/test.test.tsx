import * as React from 'react';
import renderer from 'react-test-renderer';

import { Image } from 'expo-image';

it(`renders correctly`, () => {
  const tree = renderer.create(<Image />).toJSON();

  expect(tree).toMatchSnapshot();
});
