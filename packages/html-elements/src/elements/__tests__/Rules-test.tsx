import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { HR } from '../Rules';

it('renders HR', () => {
  const { toJSON } = render(<HR />);
  expect(toJSON()).toMatchSnapshot();
});
