import { PlatformColor } from 'react-native';

import { useRouterColor } from '../useRouterColor';
import { renderHook } from '../../testing-library';

it('returns null android colors and iOS platform colors on iOS', () => {
  const { result } = renderHook(() => useRouterColor());
  expect(result.current.android.dynamic.primary).toBeNull();
  expect(result.current.ios.label).toStrictEqual(PlatformColor('label'));
});

it('keeps a stable identity across re-renders on iOS', () => {
  const { result, rerender } = renderHook(() => useRouterColor());
  const first = result.current;
  rerender({});
  expect(result.current).toBe(first);
});
