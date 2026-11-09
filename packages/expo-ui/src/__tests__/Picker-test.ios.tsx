import { render } from '@testing-library/react-native';

import { findNativeViewProps } from '../__mocks__/expo';
import { Picker } from '../universal/Picker/Picker.ios';
import { PickerItem } from '../universal/Picker/PickerItem';

jest.mock('expo', () => jest.requireActual('../__mocks__/expo'));

describe('Picker accessibilityLabel', () => {
  it('labels the picker', async () => {
    await render(
      <Picker accessibilityLabel="Flavour" selectedValue="vanilla" onValueChange={() => {}}>
        <PickerItem label="Vanilla" value="vanilla" />
        <PickerItem label="Chocolate" value="chocolate" />
      </Picker>
    );

    expect(findNativeViewProps('PickerView')?.modifiers ?? []).toContainEqual({
      $type: 'accessibilityLabel',
      label: 'Flavour',
    });
  });
});
