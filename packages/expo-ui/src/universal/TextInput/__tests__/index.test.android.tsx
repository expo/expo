import { render } from '@testing-library/react-native';

import { TextInput } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo');
jest.mock('../../../State', () => ({
  useNativeState: (value: string) => ({ value }),
  useWorkletProp: () => null,
  getStateId: () => undefined,
}));

describe('TextInput placeholder', () => {
  it.each([undefined, 'auto', 'right'] as const)(
    'inherits textStyle and respects textAlign=%s',
    async (textAlign) => {
      await render(
        <TextInput
          placeholder="Type here"
          placeholderTextColor="blue"
          textStyle={{ fontSize: 24, fontWeight: '600', letterSpacing: 2, textAlign: 'center' }}
          textAlign={textAlign}
        />
      );

      expect(findNativeViewProps('TextView')).toMatchObject({
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: 2,
        textAlign: textAlign === 'right' ? 'right' : 'center',
        color: 'blue',
      });
    }
  );
});

describe('TextInput secureTextEntry', () => {
  it('tells the keyboard the field is a password', async () => {
    await render(<TextInput secureTextEntry autoCorrect />);

    expect(findNativeViewProps('BasicTextFieldView')?.keyboardOptions).toMatchObject({
      keyboardType: 'password',
      autoCorrectEnabled: false,
    });
  });

  it('uses a number password keyboard for a numeric secure field', async () => {
    await render(<TextInput secureTextEntry keyboardType="number-pad" />);

    expect(findNativeViewProps('BasicTextFieldView')?.keyboardOptions).toMatchObject({
      keyboardType: 'numberPassword',
    });
  });
});
