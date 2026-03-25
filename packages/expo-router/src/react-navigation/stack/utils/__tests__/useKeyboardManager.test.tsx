import { describe, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { Keyboard, TextInput } from 'react-native';

import { useKeyboardManager } from '../useKeyboardManager';

jest.useFakeTimers();

describe('useKeyboardManager', () => {
  describe('onPageChangeConfirm', () => {
    test('calls onPageChangeCancel when closing is false', () => {
      const { result } = renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      const blurMock = jest.fn();
      const input = { blur: blurMock } as any;

      jest
        .spyOn(TextInput.State, 'currentlyFocusedInput')
        .mockReturnValue(input);

      act(() => result.current.onPageChangeStart());
      act(() =>
        result.current.onPageChangeConfirm({
          gesture: false,
          active: true,
          closing: false,
        })
      );

      expect(blurMock).toHaveBeenCalledTimes(1);
    });

    test('dismisses keyboard when closing without gesture', () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { result } = renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      act(() =>
        result.current.onPageChangeConfirm({
          gesture: false,
          active: false,
          closing: true,
        })
      );

      expect(dismissSpy).toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('blurs previously focused input when closing with gesture and active', () => {
      const { result } = renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      const blurMock = jest.fn();
      const input = { blur: blurMock } as any;

      jest
        .spyOn(TextInput.State, 'currentlyFocusedInput')
        .mockReturnValue(input);

      act(() => result.current.onPageChangeStart());

      blurMock.mockClear();

      act(() =>
        result.current.onPageChangeConfirm({
          gesture: true,
          active: true,
          closing: true,
        })
      );

      expect(blurMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('useLayoutEffect keyboard dismiss on focus loss', () => {
    test('dismisses keyboard when focused transitions from true to false', () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = renderHook(
        (props: { enabled: boolean; focused: boolean }) =>
          useKeyboardManager(props),
        { initialProps: { enabled: true, focused: true } }
      );

      dismissSpy.mockClear();

      rerender({ enabled: false, focused: false });

      expect(dismissSpy).toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when focused stays false', () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = renderHook(
        (props: { enabled: boolean; focused: boolean }) =>
          useKeyboardManager(props),
        { initialProps: { enabled: false, focused: false } }
      );

      dismissSpy.mockClear();

      rerender({ enabled: false, focused: false });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when only enabled changes without focus changing', () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = renderHook(
        (props: { enabled: boolean; focused: boolean }) =>
          useKeyboardManager(props),
        { initialProps: { enabled: true, focused: true } }
      );

      dismissSpy.mockClear();

      rerender({ enabled: false, focused: true });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when losing focus while disabled', () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = renderHook(
        (props: { enabled: boolean; focused: boolean }) =>
          useKeyboardManager(props),
        { initialProps: { enabled: false, focused: true } }
      );

      dismissSpy.mockClear();

      rerender({ enabled: false, focused: false });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });
  });
});
