import type { ComponentProps } from 'react';

import type { MiddlewareNode, RouteNode } from '../Route';
import type { UrlObject } from '../global-state/getRouteInfoFromState';
import type { Stack as JSStack } from '../layouts/JSStack';
import type { AbsoluteHref, AbsolutePath, ContextKey, EntryPoint } from '../types/paths';
import type { ScreenProps } from '../useScreens';
import type { Navigator, Slot } from '../views/Navigator';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type CallbackArgument<T> = T extends (arg: infer P) => unknown ? P : never;

export type _ScreenOptionsRouteKeyMayBeUndefined = Expect<
  Equal<CallbackArgument<NonNullable<ScreenProps['options']>>['route']['key'], string | undefined>
>;

export type _NavigatorLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof Navigator> ? true : false, false>
>;
export type _SlotLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof Slot> ? true : false, false>
>;
export type _JSStackLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof ComponentProps<typeof JSStack> ? true : false, false>
>;

export type _RouteNodeContextKeyIsContextKey = Expect<Equal<RouteNode['contextKey'], ContextKey>>;
export type _RouteNodeParentContextKeyIsContextKey = Expect<
  Equal<RouteNode['parentContextKey'], ContextKey | undefined>
>;
export type _MiddlewareContextKeyIsContextKey = Expect<
  Equal<MiddlewareNode['contextKey'], ContextKey>
>;
export type _SyntheticContextKeyIsAContextKey = Expect<
  Equal<'expo-router/build/views/Sitemap.js' extends ContextKey ? true : false, true>
>;
export type _PlainNameIsNotAContextKey = Expect<
  Equal<'app/index.tsx' extends ContextKey ? true : false, false>
>;
export type _DestinationContextKeyAllowsExternalUrls = Expect<
  Equal<RouteNode['destinationContextKey'], EntryPoint | undefined>
>;
export type _ExternalUrlIsAnEntryPoint = Expect<
  Equal<'https://example.com/x' extends EntryPoint ? true : false, true>
>;

export type _UrlObjectPathnameIsAbsolutePath = Expect<Equal<UrlObject['pathname'], AbsolutePath>>;
export type _UrlObjectPathnameWithParamsIsHref = Expect<
  Equal<UrlObject['pathnameWithParams'], AbsoluteHref>
>;
export type _UrlObjectGlobalHrefIsHref = Expect<
  Equal<UrlObject['unstable_globalHref'], AbsoluteHref>
>;

describe('public types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
