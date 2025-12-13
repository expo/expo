import { render } from '@testing-library/react';
import * as React from 'react';

import { BR } from '../Breaks';

it('renders BR', () => {
  const wrapper = render(<BR testID="BR" />);
  const br = wrapper.getByTestId('BR');
  expect(br.tagName).toBe('BR');
  expect(br).toMatchSnapshot();
});
