/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';

import { Picker } from '../universal/Picker';

describe('Picker accessibilityLabel', () => {
  it('labels the select element', () => {
    render(
      <Picker accessibilityLabel="Flavour" selectedValue="vanilla" onValueChange={() => {}}>
        <Picker.Item label="Vanilla" value="vanilla" />
        <Picker.Item label="Chocolate" value="chocolate" />
      </Picker>
    );

    expect(screen.getByLabelText('Flavour').tagName).toBe('SELECT');
  });
});
