import { expectType } from 'tsd';

import { useSegments } from '../useSegments';
import { renderHookOnce } from './renderHook';

describe(useSegments, () => {
  it(`defaults abstract types`, () => {
    const segments = renderHookOnce(() => useSegments());
    expectType<string>(segments[0]);
    expectType<string[]>(segments);
  });
  it(`allows abstract types`, () => {
    const segments = renderHookOnce(() => useSegments<['alpha']>());
    expectType<'alpha'>(segments[0]);
  });
  it(`allows abstract union types`, () => {
    const segments = renderHookOnce(() => useSegments<'/a' | '/b' | '/b/c'>());
    expectType<'a' | 'b'>(segments[0]);
    if (segments[0] === 'b') expectType<'c' | undefined>(segments[1]);
  });
});
