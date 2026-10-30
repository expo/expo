import { render } from '@testing-library/react-native';

import { findNativeViewProps, renderedNativeViews } from '../__mocks__/expo';
import { TextInput } from '../universal/TextInput/index.android';

jest.mock('expo', () => jest.requireActual('../__mocks__/expo'));
jest.mock('../State', () => ({
  useNativeState: (value: string) => ({ value }),
  useWorkletProp: () => null,
  getStateId: () => undefined,
}));

describe('TextInput accessibilityLabel', () => {
  it.each([
    [false, '', undefined],
    [false, 'hello', 'username'],
    [true, '', 'password'],
    [true, 'secret', 'password'],
  ] as const)(
    'labels the field with secureTextEntry=%s, text=%s, and autoComplete=%s',
    async (secureTextEntry, text, autoComplete) => {
      await render(
        <TextInput
          accessibilityLabel="Account"
          defaultValue={text}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
        />
      );

      const fieldModifiers = findNativeViewProps('BasicTextFieldView')?.modifiers ?? [];
      const decorationModifiers = findNativeViewProps('BoxView')?.modifiers ?? [];
      expect(renderedNativeViews.mock.calls.map(([name]) => name)).toContain('BasicTextFieldView');
      expect(
        fieldModifiers.filter((modifier: { $type: string }) => modifier.$type === 'semantics')
      ).toEqual(autoComplete ? [{ $type: 'semantics', contentType: autoComplete }] : []);
      expect(decorationModifiers).toContainEqual({
        $type: 'semantics',
        contentDescription: 'Account',
      });
    }
  );
});
