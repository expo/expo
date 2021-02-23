import { render } from 'enzyme';
import React from 'react';

import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('isAvailableAsync resolves to false on iOS', async () => {
    await expect(Checkbox.isAvailableAsync()).resolves.toBeFalsy();
  });

  it('throws when rendering on iOS', () => {
    expect(() => render(<Checkbox />)).toThrow('not available');
  });
});
