import { renderHook } from '@testing-library/react-native';

import { useMaterialIconSource } from '../materialIcon';

describe('useMaterialIconSource (iOS no-op)', () => {
  it('always returns undefined', () => {
    const { result } = renderHook(() => useMaterialIconSource('search'));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when name is undefined', () => {
    const { result } = renderHook(() => useMaterialIconSource(undefined));
    expect(result.current).toBeUndefined();
  });
});
