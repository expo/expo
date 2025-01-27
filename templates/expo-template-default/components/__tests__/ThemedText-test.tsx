import * as React from 'react';
import { render } from '@testing-library/react-native';

import { ThemedText } from '../ThemedText';

it(`renders correctly`, () => {
  const { getByText } = render(<ThemedText>Themed Text</ThemedText>);
  expect(getByText('Themed Text')).toBeTruthy();
});
