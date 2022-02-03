import { mount } from 'enzyme';
import React from 'react';

import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders a native checkbox', () => {
    const wrapper = mount(<Checkbox value color="#4630EB" />);
    expect(wrapper.find(Checkbox).first()).toBeDefined();
  });
});
