import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import * as Headings from '../Headings';

const headingComponentNames = Object.keys(Headings);

it.each(headingComponentNames)('renders %s', (name) => {
  const Heading = Headings[name];
  const { toJSON } = render(<Heading />);
  expect(toJSON()).toMatchSnapshot();
});
