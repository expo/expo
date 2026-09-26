import { renderHook } from '@testing-library/react-native';

import { useAssertValueDoesNotChange } from '../useAssertValueDoesNotChange';

const errorMessage = '[expo-observe] value changed';

describe(useAssertValueDoesNotChange, () => {
  it('does not throw on the initial render', async () => {
    await expect(
      renderHook(() => useAssertValueDoesNotChange(true, errorMessage))
    ).resolves.not.toThrow();
  });

  it('does not throw when the value stays equal across rerenders', async () => {
    const { rerender } = await renderHook(
      ({ value }: { value: boolean }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: true } }
    );
    await expect(rerender({ value: true })).resolves.not.toThrow();
    await expect(rerender({ value: true })).resolves.not.toThrow();
  });

  it('throws with the supplied error message when the value changes between renders', async () => {
    const { rerender } = await renderHook(
      ({ value }: { value: boolean }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: true } }
    );
    await expect(async () => await rerender({ value: false })).rejects.toThrow(errorMessage);
  });

  it('uses reference equality — a new object with the same shape triggers a throw', async () => {
    const initial = { a: 1 };
    const { rerender } = await renderHook(
      ({ value }: { value: { a: number } }) => useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: initial } }
    );
    await expect(async () => await rerender({ value: { a: 1 } })).rejects.toThrow(errorMessage);
  });

  it('tracks independent initial values for sibling instances inside the same render', async () => {
    const { rerender } = await renderHook(
      ({ a, b }: { a: number; b: number }) => {
        useAssertValueDoesNotChange(a, 'a-changed');
        useAssertValueDoesNotChange(b, 'b-changed');
      },
      { initialProps: { a: 1, b: 2 } }
    );
    // First instance unchanged, second changed → only the second message is thrown.
    await expect(async () => await rerender({ a: 1, b: 99 })).rejects.toThrow('b-changed');
  });

  it('does not throw when initial value is undefined and stays undefined', async () => {
    const { rerender } = await renderHook(
      ({ value }: { value: string | undefined }) =>
        useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: undefined } }
    );
    await expect(rerender({ value: undefined })).resolves.not.toThrow();
  });

  it('throws when transitioning from undefined to a defined value', async () => {
    const { rerender } = await renderHook(
      ({ value }: { value: string | undefined }) =>
        useAssertValueDoesNotChange(value, errorMessage),
      { initialProps: { value: undefined } }
    );
    await expect(async () => await rerender({ value: 'set' })).rejects.toThrow(errorMessage);
  });
});
