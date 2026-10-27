/* eslint-disable @typescript-eslint/no-unused-vars */
import type { MaterialTopTabBarProps } from '../types';

// Type-equality helpers
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

// ---------------------------------------------------------------------------
// MaterialTopTabBarProps must carry real types
// ---------------------------------------------------------------------------

// This type used to be declared as `any & { … }`. An intersection with `any` collapses to
// `any`, so a custom `tabBar` received no type information at all.
export type _PropsAreNotAny = Expect<Equal<IsAny<MaterialTopTabBarProps>, false>>;
export type _StateIsNotAny = Expect<Equal<IsAny<MaterialTopTabBarProps['state']>, false>>;
export type _NavigationIsNotAny = Expect<Equal<IsAny<MaterialTopTabBarProps['navigation']>, false>>;
export type _DescriptorsAreNotAny = Expect<
  Equal<IsAny<MaterialTopTabBarProps['descriptors']>, false>
>;

// `MaterialTopTabView` forwards the scene-renderer props it receives from `TabView`, so they
// have to stay part of the public type.
export type _HasLayout = Expect<
  Equal<MaterialTopTabBarProps['layout'], { width: number; height: number }>
>;
export type _HasJumpTo = Expect<Equal<MaterialTopTabBarProps['jumpTo'], (key: string) => void>>;

// ---------------------------------------------------------------------------
// The usage reported in expo/expo#49809
// ---------------------------------------------------------------------------

// Mapping over the routes must infer its callback parameters. While the props were `any`
// this failed under `strict` with TS7006 (`Parameter 'route' implicitly has an 'any' type`).
export function renderTabLabels({ state, descriptors }: MaterialTopTabBarProps) {
  return state.routes.map((route, index) => {
    const key: string = route.key;
    const name: string = route.name;
    const position: number = index;

    return descriptors[route.key]?.options.title ?? `${position}:${key}:${name}`;
  });
}

describe('material-top-tabs types', () => {
  it('is type-checked by tsc via pnpm typecheck or et check-packages', () => {
    expect(typeof renderTabLabels).toBe('function');
  });
});
