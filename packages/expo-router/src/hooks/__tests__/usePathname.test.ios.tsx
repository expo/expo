import { act } from '@testing-library/react-native';

import { router } from '../../exports';
import { usePathname } from '../usePathname';
import { renderHook } from './renderHook';

describe(usePathname, () => {
  it(`return pathname of deeply nested routes`, () => {
    const { result } = renderHook(() => usePathname(), ['[fruit]/[shape]/[...veg?]'], {
      initialUrl: '/apple/square',
    });

    expect(result.current).toEqual('/apple/square');

    act(() => router.push('/banana/circle/carrot'));
    expect(result.current).toEqual('/banana/circle/carrot');

    act(() => router.push('/banana/circle/carrot/beetroot'));
    expect(result.current).toEqual('/banana/circle/carrot/beetroot');

    act(() => router.push('/banana/circle/carrot/beetroot/beans'));
    expect(result.current).toEqual('/banana/circle/carrot/beetroot/beans');

    act(() => router.push('/banana/circle/carrot/beetroot?foo=bar'));
    expect(result.current).toEqual('/banana/circle/carrot/beetroot');
  });
});
