import type { DescriptorRouteProp, ParamListBase } from '../../native';
import type { NativeStackOptionsArgs } from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type _OptionsRouteIsDescriptorRoute = Expect<
  Equal<NativeStackOptionsArgs<ParamListBase>['route'], DescriptorRouteProp<ParamListBase>>
>;
export type _OptionsRouteKeyMayBeUndefined = Expect<
  Equal<NativeStackOptionsArgs<ParamListBase>['route']['key'], string | undefined>
>;

describe('native stack types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
