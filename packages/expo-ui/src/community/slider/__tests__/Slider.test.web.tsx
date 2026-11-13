/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';

import { Slider } from '..';

describe('Slider (web)', () => {
  it('labels the range input and exposes its test ID', () => {
    render(<Slider value={4} maximumValue={16} accessibilityLabel="Pulses" testID="pulses" />);

    expect(screen.getByRole('slider', { name: 'Pulses' })).toBe(screen.getByTestId('pulses'));
  });
});
