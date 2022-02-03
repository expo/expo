import { mount } from 'enzyme';
import React from 'react';

import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders content matching snapshot', () => {
    const wrapper = mount(<Checkbox value color="#4630EB" />);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders a native checkbox', () => {
    const wrapper = mount(<Checkbox color="#4630EB" />);
    const checkbox = wrapper.find('input').first();

    expect(checkbox).toBeDefined();
    expect(checkbox.props()).toMatchObject({ type: 'checkbox' });
  });

  it('handles checkbox events', async () => {
    const onChange = jest.fn();
    const onValueChange = jest.fn();

    const wrapper = mount(<Checkbox value onChange={onChange} onValueChange={onValueChange} />);
    const input = wrapper.find('input').first();

    // this will only trigger a change, with the current value (true)
    input.simulate('change');

    expect(onChange).toBeCalledWith(expect.any(Object));
    expect(onValueChange).toBeCalledWith(true);
  });
});
