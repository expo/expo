import { act, renderHook } from '@testing-library/react-native';
import { Keyboard, TextInput } from 'react-native';

import { useKeyboardManager } from '../useKeyboardManager';

jest.useFakeTimers();

describe('useKeyboardManager', () => {
  describe('onPageChangeConfirm', () => {
    test('calls onPageChangeCancel when closing is false', async () => {
      const { result } = await renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      const blurMock = jest.fn();
      const input = { blur: blurMock } as any;

      jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue(input);

      await act(() => result.current.onPageChangeStart());
      await act(() =>
        result.current.onPageChangeConfirm({
          gesture: false,
          active: true,
          closing: false,
        })
      );

      expect(blurMock).toHaveBeenCalledTimes(1);
    });

    test('dismisses keyboard when closing without gesture', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { result } = await renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      await act(() =>
        result.current.onPageChangeConfirm({
          gesture: false,
          active: false,
          closing: true,
        })
      );

      expect(dismissSpy).toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('blurs previously focused input when closing with gesture and active', async () => {
      const { result } = await renderHook(() =>
        useKeyboardManager({ enabled: true, focused: true })
      );

      const blurMock = jest.fn();
      const input = { blur: blurMock } as any;

      jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue(input);

      await act(() => result.current.onPageChangeStart());

      blurMock.mockClear();

      await act(() =>
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
    test('dismisses keyboard when focused transitions from true to false', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = await renderHook(
        (props: { enabled: boolean; focused: boolean }) => useKeyboardManager(props),
        { initialProps: { enabled: true, focused: true } }
      );

      dismissSpy.mockClear();

      await rerender({ enabled: true, focused: false });

      expect(dismissSpy).toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when focus is lost in the same render that disables it', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = await renderHook(
        (props: { enabled: boolean; focused: boolean }) => useKeyboardManager(props),
        { initialProps: { enabled: true, focused: true } }
      );

      dismissSpy.mockClear();

      await rerender({ enabled: false, focused: false });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when focused stays false', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = await renderHook(
        (props: { enabled: boolean; focused: boolean }) => useKeyboardManager(props),
        { initialProps: { enabled: false, focused: false } }
      );

      dismissSpy.mockClear();

      await rerender({ enabled: false, focused: false });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when only enabled changes without focus changing', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = await renderHook(
        (props: { enabled: boolean; focused: boolean }) => useKeyboardManager(props),
        { initialProps: { enabled: true, focused: true } }
      );

      dismissSpy.mockClear();

      await rerender({ enabled: false, focused: true });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    test('does not dismiss keyboard when losing focus while disabled', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');

      const { rerender } = await renderHook(
        (props: { enabled: boolean; focused: boolean }) => useKeyboardManager(props),
        { initialProps: { enabled: false, focused: true } }
      );

      dismissSpy.mockClear();

      await rerender({ enabled: false, focused: false });

      expect(dismissSpy).not.toHaveBeenCalled();

      dismissSpy.mockRestore();
    });
  });
});
