import { render } from '@testing-library/react-native';

import { Slider } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';
import { accessibilityHint, accessibilityLabel } from '../../../swift-ui/modifiers';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

describe('Slider (iOS)', () => {
  it('names the SwiftUI slider for VoiceOver and end-to-end tests', async () => {
    await render(
      <Slider
        value={4}
        maximumValue={16}
        accessibilityLabel="Pulses"
        accessibilityHint="Sets how many steps play"
        testID="pulses"
      />
    );

    const props = findNativeViewProps('SliderView');
    expect(props?.modifiers).toEqual(
      expect.arrayContaining([
        accessibilityLabel('Pulses'),
        accessibilityHint('Sets how many steps play'),
      ])
    );
    expect(props?.testID).toBe('pulses');
  });

  it('adds no modifiers when none are asked for', async () => {
    await render(<Slider value={4} />);

    expect(findNativeViewProps('SliderView')?.modifiers).toBeUndefined();
  });
});
