import { mount } from 'enzyme';
import * as React from 'react';

import { StatusBar as ExpoStatusBar } from '../StatusBar';

describe('StatusBar', () => {
  it('defaults to translucent', () => {
    const result = mount(<ExpoStatusBar />);
    expect(
      result
        .children()
        .first()
        .props().translucent
    ).toBe(true);
  });

  it('respects the translucent value passed in', () => {
    const result = mount(<ExpoStatusBar translucent={false} />);
    expect(
      result
        .children()
        .first()
        .props().translucent
    ).toBe(false);
  });
});
