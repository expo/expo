import { render } from '@testing-library/react-native';

import { findNativeViewProps, renderedNativeViews } from '../__mocks__/expo';
import { TextInput } from '../universal/TextInput/index.ios';

jest.mock('expo', () => jest.requireActual('../__mocks__/expo'));
jest.mock('../State', () => ({
  useNativeState: (value: string) => ({ value }),
  useWorkletProp: () => null,
  getStateId: () => undefined,
}));

describe('TextInput accessibilityLabel', () => {
  it.each([
    [false, ''],
    [false, 'hello'],
    [true, ''],
    [true, 'secret'],
  ] as const)(
    'labels the field with secureTextEntry=%s and text=%s',
    async (secureTextEntry, text) => {
      await render(
        <TextInput
          accessibilityLabel="Account"
          defaultValue={text}
          secureTextEntry={secureTextEntry}
          placeholder="Type here"
          placeholderTextColor="blue"
        />
      );

      const viewName = secureTextEntry ? 'SecureFieldView' : 'TextFieldView';
      expect(renderedNativeViews.mock.calls.map(([name]) => name)).toContain(viewName);
      expect(findNativeViewProps(viewName)?.modifiers ?? []).toContainEqual({
        $type: 'accessibilityLabel',
        label: 'Account',
      });
    }
  );
});
