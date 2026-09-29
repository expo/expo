import type { DescriptorRouteProp, ParamListBase } from '../../native';
import type { NativeStackNavigationOptions, NativeStackOptionsArgs } from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type _OptionsRouteIsDescriptorRoute = Expect<
  Equal<NativeStackOptionsArgs<ParamListBase>['route'], DescriptorRouteProp<ParamListBase>>
>;
export type _OptionsRouteKeyMayBeUndefined = Expect<
  Equal<NativeStackOptionsArgs<ParamListBase>['route']['key'], string | undefined>
>;
export type _HeaderUserInterfaceStyle = Expect<
  Equal<NativeStackNavigationOptions['headerUserInterfaceStyle'], 'light' | 'dark' | undefined>
>;

describe('native stack types', () => {
  it('type-checks', () => {
    const light: NativeStackNavigationOptions = { headerUserInterfaceStyle: 'light' };
    const dark: NativeStackNavigationOptions = { headerUserInterfaceStyle: 'dark' };
    // @ts-expect-error The native header accepts only light and dark styles.
    const invalid: NativeStackNavigationOptions = { headerUserInterfaceStyle: 'auto' };
    expect(light.headerUserInterfaceStyle).toBe('light');
    expect(dark.headerUserInterfaceStyle).toBe('dark');
    expect(invalid.headerUserInterfaceStyle).toBe('auto');
  });
});
