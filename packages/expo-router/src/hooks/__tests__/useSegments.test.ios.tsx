import { expectTypeOf } from 'expect-type';

import { useSegments } from '../useSegments';
import { renderHookOnce } from './renderHook';

describe(useSegments, () => {
  it(`defaults abstract types`, () => {
    const segments = renderHookOnce(() => useSegments());
    expectTypeOf(segments[0]).toEqualTypeOf<string>();
    expectTypeOf(segments).toExtend<string[]>();
  });
  it(`allows abstract types`, () => {
    const segments = renderHookOnce(() => useSegments<['alpha']>());
    expectTypeOf(segments[0]).toEqualTypeOf<'alpha'>();
  });
  it(`allows abstract union types`, () => {
    const segments = renderHookOnce(() => useSegments<'/a' | '/b' | '/b/c'>());
    expectTypeOf(segments[0]).toEqualTypeOf<'a' | 'b'>();
    if (segments[0] === 'b') expectTypeOf(segments[1]).toEqualTypeOf<'c' | undefined>();
  });
});
