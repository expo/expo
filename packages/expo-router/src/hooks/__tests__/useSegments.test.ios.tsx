import { expectTypeOf } from 'expect-type';

import { useSegments } from '../useSegments';
import { renderHookOnce } from './renderHook';

describe(useSegments, () => {
  it(`defaults abstract types`, async () => {
    const segments = await renderHookOnce(() => useSegments());
    expectTypeOf(segments[0]).toEqualTypeOf<string>();
    expectTypeOf(segments).toExtend<string[]>();
  });
  it(`allows abstract types`, async () => {
    const segments = await renderHookOnce(() => useSegments<['alpha']>());
    expectTypeOf(segments[0]).toEqualTypeOf<'alpha'>();
  });
  it(`allows abstract union types`, async () => {
    const segments = await renderHookOnce(() => useSegments<'/a' | '/b' | '/b/c'>());
    expectTypeOf(segments[0]).toEqualTypeOf<'a' | 'b'>();
    if (segments[0] === 'b') expectTypeOf(segments[1]).toEqualTypeOf<'c' | undefined>();
  });
});
