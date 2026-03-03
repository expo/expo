import { act, renderHook } from '@testing-library/react-native';
import type { AndroidSymbol } from 'expo-symbols';

const mockGetMaterialSymbolSourceAsync = jest.fn();

jest.mock('expo-symbols', () => ({
  unstable_getMaterialSymbolSourceAsync: (
    ...args: Parameters<typeof mockGetMaterialSymbolSourceAsync>
  ) => mockGetMaterialSymbolSourceAsync(...args),
}));

// eslint-disable-next-line import/first
import { useMaterialIconSource } from '../materialIcon';

const SEARCH: AndroidSymbol = 'search';
const STAR: AndroidSymbol = 'star';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMaterialIconSource (Android)', () => {
  it('returns undefined initially, then resolves to ImageSourcePropType', async () => {
    const resolvedSource = { uri: 'resolved-icon' };
    mockGetMaterialSymbolSourceAsync.mockResolvedValue(resolvedSource);

    const { result } = renderHook(() => useMaterialIconSource(SEARCH));

    // Initially undefined while loading
    expect(result.current).toBeUndefined();

    await act(async () => {});

    // After resolution
    expect(result.current).toEqual(resolvedSource);
    expect(mockGetMaterialSymbolSourceAsync).toHaveBeenCalledWith('search', 24, 'white');
  });

  it('returns undefined when name is undefined', () => {
    const { result } = renderHook(() => useMaterialIconSource(undefined));

    expect(result.current).toBeUndefined();
    expect(mockGetMaterialSymbolSourceAsync).not.toHaveBeenCalled();
  });

  it('handles null result from resolver', async () => {
    mockGetMaterialSymbolSourceAsync.mockResolvedValue(null);

    const { result } = renderHook(() => useMaterialIconSource(SEARCH));

    await act(async () => {});

    expect(result.current).toBeUndefined();
  });

  it('cancels pending resolution on unmount', async () => {
    let resolvePromise: (value: unknown) => void;
    mockGetMaterialSymbolSourceAsync.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useMaterialIconSource(SEARCH));

    expect(result.current).toBeUndefined();

    unmount();

    // Resolve after unmount — should not cause state update
    await act(async () => {
      resolvePromise!({ uri: 'resolved-after-unmount' });
    });
  });

  it('re-resolves when name changes', async () => {
    const source1 = { uri: 'icon-search' };
    const source2 = { uri: 'icon-star' };
    mockGetMaterialSymbolSourceAsync.mockResolvedValueOnce(source1).mockResolvedValueOnce(source2);

    const { result, rerender } = renderHook(
      ({ name }: { name: AndroidSymbol }) => useMaterialIconSource(name),
      { initialProps: { name: SEARCH } }
    );

    await act(async () => {});
    expect(result.current).toEqual(source1);

    rerender({ name: STAR });
    // Source resets to undefined while new icon is loading
    expect(result.current).toBeUndefined();

    await act(async () => {});
    expect(result.current).toEqual(source2);
  });

  it('handles rejected promise without crashing', async () => {
    mockGetMaterialSymbolSourceAsync.mockRejectedValue(new Error('Font not loaded'));

    const { result } = renderHook(() => useMaterialIconSource(SEARCH));

    await act(async () => {});

    // Stays undefined — no crash, no state update
    expect(result.current).toBeUndefined();
  });
});
