import { render } from '@testing-library/react-native';

import { Slider } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';
import { semantics, testID } from '../../../jetpack-compose/modifiers';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

describe('Slider (Android)', () => {
  it('names the Compose slider for TalkBack and end-to-end tests', async () => {
    await render(
      <Slider value={4} maximumValue={16} accessibilityLabel="Pulses" testID="pulses" />
    );

    expect(findNativeViewProps('SliderView')?.modifiers).toEqual([
      semantics({ contentDescription: 'Pulses' }),
      testID('pulses'),
    ]);
  });

  it('adds no modifiers when none are asked for', async () => {
    await render(<Slider value={4} />);

    expect(findNativeViewProps('SliderView')?.modifiers).toBeUndefined();
  });
});
