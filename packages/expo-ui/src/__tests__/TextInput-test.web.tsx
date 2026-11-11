/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';

import { TextInput } from '../universal/TextInput';

describe('TextInput accessibilityLabel', () => {
  it.each([false, true])(
    'keeps the label after editing with secureTextEntry=%s',
    (secureTextEntry) => {
      render(
        <TextInput
          accessibilityLabel="Account"
          placeholder="Type here"
          secureTextEntry={secureTextEntry}
        />
      );

      const input = screen.getByLabelText('Account') as HTMLInputElement;
      expect(input.value).toBe('');
      expect(input.type).toBe(secureTextEntry ? 'password' : 'text');

      fireEvent.change(input, { target: { value: 'hello' } });
      expect(screen.getByLabelText('Account')).toBe(input);
      expect(input.value).toBe('hello');

      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByLabelText('Account')).toBe(input);
      expect(input.value).toBe('');
    }
  );
});
