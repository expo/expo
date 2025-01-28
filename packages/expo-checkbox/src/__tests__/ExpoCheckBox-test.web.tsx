/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import React from 'react';

import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders content matching snapshot', async () => {
    const wrapper = render(<Checkbox value color="#4630EB" testID="checkbox" />);
    const view = await wrapper.findAllByTestId('checkbox');
    expect(view).toMatchSnapshot();
  });

  it('renders a native checkbox', async () => {
    const wrapper = render(<Checkbox color="#4630EB" testID="checkbox" />);
    expect(await wrapper.findAllByRole('checkbox')).toHaveLength(1);
  });

  it('handles checkbox events', async () => {
    const onChange = jest.fn();
    const onValueChange = jest.fn();
    const checked = true;

    const wrapper = render(
      <Checkbox value={checked} onChange={onChange} onValueChange={onValueChange} />
    );
    const checkbox = await wrapper.findByRole('checkbox');
    checkbox.click();

    expect(onChange).toBeCalledWith(expect.any(Object));
    expect(onValueChange).toBeCalledWith(!checked);
  });

  it('sets the correct id on the input element', () => {
    const testId = 'my-test-id';
    const { getByRole } = render(<Checkbox id={testId} />);
    const checkboxInput = getByRole('checkbox');

    expect(checkboxInput.getAttribute('id')).toBe('my-test-id');
  });
});
