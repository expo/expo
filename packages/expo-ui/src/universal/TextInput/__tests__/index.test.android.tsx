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
