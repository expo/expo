import 'react-native';
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { LI, UL } from '../Lists';

it('renders UL nested in LI', () => {
  const { toJSON } = render(
    <LI>
      <LI>item</LI>
      <UL>
        <LI>item</LI>
      </UL>
    </LI>
  );
  expect(toJSON()).toMatchSnapshot();
});
