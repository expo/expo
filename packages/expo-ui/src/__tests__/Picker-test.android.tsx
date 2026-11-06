import { render } from '@testing-library/react-native';

import { findNativeViewProps } from '../__mocks__/expo';
import { Picker } from '../universal/Picker/Picker.android';
import { PickerItem } from '../universal/Picker/PickerItem';

jest.mock('expo', () => jest.requireActual('../__mocks__/expo'));
jest.mock('../State', () => ({
  useNativeState: (value: string) => ({ value }),
  useWorkletProp: () => null,
  getStateId: () => undefined,
}));

describe('Picker accessibilityLabel', () => {
  it('labels the anchor field', async () => {
    await render(
      <Picker accessibilityLabel="Flavour" selectedValue="vanilla" onValueChange={() => {}}>
        <PickerItem label="Vanilla" value="vanilla" />
        <PickerItem label="Chocolate" value="chocolate" />
      </Picker>
    );

    expect(findNativeViewProps('TextFieldView')?.modifiers ?? []).toContainEqual({
      $type: 'semantics',
      contentDescription: 'Flavour',
    });
  });
});
