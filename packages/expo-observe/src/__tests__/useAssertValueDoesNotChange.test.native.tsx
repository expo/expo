import { renderHook } from '@testing-library/react-native';

import { useAssertValueDoesNotChange } from '../useAssertValueDoesNotChange';

const errorMessage = '[expo-observe] value changed';

describe(useAssertValueDoesNotChange, () => {
  it('does not throw on the initial render', () => {
    expect(() => renderHook(() => useAssertValueDoesNotChange(true, errorMessage))).not.toThrow();
  });

  it('does not throw when the value stays equal across rerenders', () => {
    const { rerender } = renderHook(
      ({ value }: { value: boolean }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: true } }
    );
    expect(() => rerender({ value: true })).not.toThrow();
    expect(() => rerender({ value: true })).not.toThrow();
  });

  it('throws with the supplied error message when the value changes between renders', () => {
    const { rerender } = renderHook(
      ({ value }: { value: boolean }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: true } }
    );
    expect(() => rerender({ value: false })).toThrow(errorMessage);
  });

  it('uses reference equality — a new object with the same shape triggers a throw', () => {
    const initial = { a: 1 };
    const { rerender } = renderHook(
      ({ value }: { value: { a: number } }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: initial } }
    );
    expect(() => rerender({ value: { a: 1 } })).toThrow(errorMessage);
  });

  it('tracks independent initial values for sibling instances inside the same render', () => {
    const { rerender } = renderHook(
      ({ a, b }: { a: number; b: number }) => {
        useAssertValueDoesNotChange(a, 'a-changed');
        useAssertValueDoesNotChange(b, 'b-changed');
      },
      { initialProps: { a: 1, b: 2 } }
    );
    // First instance unchanged, second changed → only the second message is thrown.
    expect(() => rerender({ a: 1, b: 99 })).toThrow('b-changed');
  });

  it('does not throw when initial value is undefined and stays undefined', () => {
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: undefined } }
    );
    expect(() => rerender({ value: undefined })).not.toThrow();
  });

  it('throws when transitioning from undefined to a defined value', () => {
    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: undefined } }
    );
    expect(() => rerender({ value: 'set' })).toThrow(errorMessage);
  });
});
