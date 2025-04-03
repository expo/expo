import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { A } from '../Anchor';

it('renders A', () => {
  const { toJSON } = render(<A href="#" target="_parent" />);
  expect(toJSON()).toMatchSnapshot();
});
