import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { BR } from '../Breaks';

it('renders BR', () => {
  const { toJSON } = render(<BR />);
  expect(toJSON()).toMatchSnapshot();
});
