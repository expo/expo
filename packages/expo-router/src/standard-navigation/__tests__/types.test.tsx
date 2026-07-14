/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ComponentProps } from 'react';
import {
  createStandardNavigator,
  type NavigatorArgs,
  type NavigatorDescriptor,
} from 'standard-navigation';

import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import type { GoBackAction, NavigateAction } from '../../react-navigation/routers/CommonActions';
import { unstable_createStandardRouterNavigator, unstable_integrateWithRouter } from '../index';
import type {
  IntegrateWithRouterOptions,
  NavigatorContentProps,
  StandardNavigationAction,
  StandardNavigatorDescriptor,
} from '../types';

// Type-equality helpers
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Opts = { title?: string };
type EventMap = { tabPress: { data: undefined; canPreventDefault: true } };

export type _DescriptorExtendsStandardDescriptor = Expect<
  StandardNavigatorDescriptor<Opts> extends NavigatorDescriptor<Opts> ? true : false
>;

function Content(_args: NavigatorArgs<Opts, EventMap>) {
  return null;
}

// ---------------------------------------------------------------------------
// StandardNavigationAction
// ---------------------------------------------------------------------------

export type _ActionIsNavigateOrGoBack = Expect<
  Equal<StandardNavigationAction, NavigateAction | GoBackAction>
>;

// StandardNavigationAction must remain a subset of the common action union so it can be dispatched
// through any RouterFactory (e.g. TabRouter's `TabActionType | CommonNavigationAction`).
export type _ActionAssignableToCommon = Expect<
  StandardNavigationAction extends CommonNavigationAction ? true : false
>;

export const _validActions: StandardNavigationAction[] = [
  { type: 'GO_BACK' },
  { type: 'NAVIGATE', payload: { name: 'home' } },
];

// @ts-expect-error RESET is not part of StandardNavigationAction.
export const _invalidAction: StandardNavigationAction = { type: 'RESET', payload: { routes: [] } };

// ---------------------------------------------------------------------------
// Returned component exposes typed .Screen / .Protected
// ---------------------------------------------------------------------------

const Nav = unstable_createStandardRouterNavigator<
  Opts,
  TabNavigationState<ParamListBase>,
  EventMap,
  object,
  TabRouterOptions
>(Content, TabRouter);

export type _HasScreen = Expect<Equal<typeof Nav extends { Screen: unknown } ? true : false, true>>;
export type _HasProtected = Expect<
  Equal<typeof Nav extends { Protected: unknown } ? true : false, true>
>;

// ---------------------------------------------------------------------------
// screenListeners / screenOptions function form, derived from the navigator's own props
// ---------------------------------------------------------------------------

type Props = ComponentProps<typeof Nav>;

type ListenersFn = Extract<Props['screenListeners'], (...args: any) => any>;
type OptionsFn = Extract<Props['screenOptions'], (...args: any) => any>;

export const _listeners: ListenersFn = ({ route, navigation }) => {
  navigation.navigate();
  // @ts-expect-error the route passed to screenListeners must not expose `href`.
  route.href;
  return { focus: () => route.name };
};

export const _options: OptionsFn = ({ route, theme }) => {
  // @ts-expect-error the route passed to screenOptions must not expose `href`.
  route.href;
  return { title: `${route.name}-${theme.dark}` };
};

type NavProps = { tintColor?: string };
type CreateProps = { routeNames: string[]; preload: (name: string) => void };
type SplitContentProps = NavigatorContentProps<Opts, EventMap, NavProps, CreateProps>;
type RequiredNavProps = { label: string };
type TabState = TabNavigationState<ParamListBase>;

function SplitContent(_props: SplitContentProps) {
  return null;
}

function PublicContent(_props: NavigatorContentProps<Opts, EventMap, NavProps>) {
  return null;
}

function RequiredPublicContent(_props: NavigatorContentProps<Opts, EventMap, RequiredNavProps>) {
  return null;
}

const splitStandardNavigator = createStandardNavigator<Opts, EventMap, NavProps & CreateProps>(
  SplitContent
);
const publicStandardNavigator = createStandardNavigator<Opts, EventMap, NavProps>(PublicContent);

// These instantiated signatures are for explicit-instantiation tests only. Inference tests below
// call the original functions directly so they continue to exercise the carrier and `NoInfer`.
const createSplitNav = unstable_createStandardRouterNavigator<
  Opts,
  TabState,
  EventMap,
  NavProps,
  TabRouterOptions,
  CreateProps
>;
const createPublicNav = unstable_createStandardRouterNavigator<
  Opts,
  TabState,
  EventMap,
  NavProps,
  TabRouterOptions
>;
const integrateSplitNav = unstable_integrateWithRouter<
  Opts,
  TabState,
  EventMap,
  NavProps,
  TabRouterOptions,
  CreateProps
>;
const integratePublicNav = unstable_integrateWithRouter<
  Opts,
  TabState,
  EventMap,
  NavProps,
  TabRouterOptions
>;

// ---------------------------------------------------------------------------
// Injected CreateProps keys reach content but never leak into element props
// ---------------------------------------------------------------------------

const SplitNav = createSplitNav(SplitContent, TabRouter, {
  createProps: () => ({ routeNames: [], preload: () => {} }),
});
type SplitElementProps = ComponentProps<typeof SplitNav>;

const InferredSplitNav = unstable_createStandardRouterNavigator(SplitContent, TabRouter, {
  createProps: () => ({ routeNames: [], preload: () => {} }),
});
type InferredSplitElementProps = ComponentProps<typeof InferredSplitNav>;

export type _ExplicitAndInferredElementPropsMatch = Expect<
  Equal<SplitElementProps, InferredSplitElementProps>
>;
export type _ElementAcceptsNavigatorProps = Expect<
  Equal<InferredSplitElementProps['tintColor'], string | undefined>
>;
export type _ContentRequiresRouteNames = Expect<Equal<SplitContentProps['routeNames'], string[]>>;
export type _ElementLacksRouteNames = Expect<
  Equal<'routeNames' extends keyof InferredSplitElementProps ? true : false, false>
>;

const InferredPublicNav = unstable_createStandardRouterNavigator(RequiredPublicContent, TabRouter);
type InferredPublicElementProps = ComponentProps<typeof InferredPublicNav>;
export type _InferredElementRequiresPublicProp = Expect<
  Equal<InferredPublicElementProps['label'], string>
>;

// ---------------------------------------------------------------------------
// createProps and the options argument are required iff content declares injected props
// ---------------------------------------------------------------------------

// @ts-expect-error Inferred non-empty CreateProps require the options argument.
unstable_createStandardRouterNavigator(SplitContent, TabRouter);

type OptionalCreateProps = { a?: string };
function OptionalCreateContent(
  _props: NavigatorContentProps<Opts, EventMap, object, OptionalCreateProps>
) {
  return null;
}

// @ts-expect-error CreateProps with optional keys still require options.
unstable_createStandardRouterNavigator(OptionalCreateContent, TabRouter);
unstable_createStandardRouterNavigator(OptionalCreateContent, TabRouter, {
  createProps: () => ({}),
});

// @ts-expect-error The options argument is required when `CreateProps` is non-empty.
createSplitNav(SplitContent, TabRouter);

// @ts-expect-error `createProps` is required when `CreateProps` is non-empty.
createSplitNav(SplitContent, TabRouter, { useOnlyUserDefinedScreens: true });

createPublicNav(PublicContent, TabRouter);

// ---------------------------------------------------------------------------
// createProps cannot declare props the content does not declare
// ---------------------------------------------------------------------------

// `NoInfer` keeps a zero-argument factory from declaring injected props for content that has none.
unstable_createStandardRouterNavigator(PublicContent, TabRouter, {
  // @ts-expect-error `PublicContent` does not declare any injected props.
  createProps: () => ({ injected: true }),
});

// @ts-expect-error Five explicit generics declare no injected props, so `createProps` is forbidden.
createPublicNav(PublicContent, TabRouter, { createProps: () => ({ injected: true }) });

const broadlyAnnotatedFactoryOptions: IntegrateWithRouterOptions = {
  // @ts-expect-error Bare options do not declare injected props, so `createProps` is forbidden.
  createProps: () => ({ injected: true }),
};
unstable_createStandardRouterNavigator(PublicContent, TabRouter, broadlyAnnotatedFactoryOptions);

type CarrierCreateProps = { x: string };
function CarrierContent(
  _props: NavigatorContentProps<Opts, EventMap, object, CarrierCreateProps>
) {
  return null;
}

unstable_createStandardRouterNavigator<
  Opts,
  TabState,
  EventMap,
  object,
  TabRouterOptions,
  { x: number }
  // @ts-expect-error Explicit CreateProps must match the content's declared CreateProps.
>(CarrierContent, TabRouter, { createProps: () => ({ x: 1 }) });

// ---------------------------------------------------------------------------
// createProps return shape is exact
// ---------------------------------------------------------------------------

createSplitNav(SplitContent, TabRouter, {
  // @ts-expect-error `createProps` must return the complete `CreateProps` shape.
  createProps: () => ({ routeNames: [] }),
});

createSplitNav(SplitContent, TabRouter, {
  createProps: (): CreateProps => ({
    routeNames: [],
    preload: () => {},
    // @ts-expect-error `createProps` must not return undeclared properties.
    extra: true,
  }),
});

// ---------------------------------------------------------------------------
// unstable_integrateWithRouter enforces the same contract on its own signature
// ---------------------------------------------------------------------------

// Shared option types are exhaustively tested above. This smoke set guards the independently
// declared rest tuple and verifies the resulting element props.
const IntegratedSplitNav = integrateSplitNav(splitStandardNavigator, TabRouter, {
  createProps: () => ({ routeNames: [], preload: () => {} }),
});
type IntegratedSplitElementProps = ComponentProps<typeof IntegratedSplitNav>;
export type _IntegratedAndCreatedElementPropsMatch = Expect<
  Equal<IntegratedSplitElementProps, SplitElementProps>
>;

// @ts-expect-error The options argument is required when `CreateProps` is non-empty.
integrateSplitNav(splitStandardNavigator, TabRouter);

integratePublicNav(publicStandardNavigator, TabRouter);

describe('standard-navigation types', () => {
  it('is type-checked by tsc via pnpm typecheck or et check-packages', () => {
    expect(typeof unstable_createStandardRouterNavigator).toBe('function');
  });
});
