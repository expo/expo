import { act } from '@testing-library/react-native';

import { router } from '../../exports';
import { useUnstableGlobalHref } from '../useUnstableGlobalHref';
import { renderHook } from './renderHook';

describe(useUnstableGlobalHref, () => {
  it('returns the global href including search params', () => {
    const { result } = renderHook(() => useUnstableGlobalHref(), ['[fruit]', 'profile/[id]'], {
      initialUrl: '/apple?color=red',
    });

    expect(result.current).toBe('/apple?color=red');

    act(() => router.push('/profile/evan?tab=posts'));

    expect(result.current).toBe('/profile/evan?tab=posts');
  });
});
