/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ComponentProps } from 'react';
import {
  createStandardNavigator,
  type NavigatorArgs,
  type NavigatorDescriptor,
} from 'standard-navigation';

import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  type DefaultRouterOptions,
  type NavigationAction,
  type NavigationState,
  type Router,
  type RouterFactory,
  StackRouter,
  type StackNavigationState,
  type StackRouterOptions,
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
  { initialRouteName?: string },
  TabRouterOptions
>(Content, TabRouter);

type ApplicationOptions = { customOption?: number };
type ExtendedOptions = Opts & ApplicationOptions;

const ExtendedNav = unstable_createStandardRouterNavigator<
  ExtendedOptions,
  TabNavigationState<ParamListBase>,
  EventMap,
  { initialRouteName?: string },
  TabRouterOptions
>((args) => {
  args.descriptors.index?.options.customOption satisfies number | undefined;
  return null;
}, TabRouter);

<ExtendedNav.Screen name="index" options={{ title: 'Home', customOption: 123 }} />;
<ExtendedNav.Screen
  name="index"
  options={({ route }) => ({ title: route.name, customOption: 123 })}
/>;
// @ts-expect-error Application-defined options retain their declared value type.
<ExtendedNav.Screen name="index" options={{ customOption: '123' }} />;
// @ts-expect-error Undeclared options are rejected.
<ExtendedNav.Screen name="index" options={{ unknownOption: true }} />;

type TypelessNavigationState = Readonly<{
  key: string;
  routeKeySeq: number;
  index: number;
  routeNames: string[];
  routes: { key: string; name: string; params?: object }[];
  stale: false;
}>;

const TypelessRouter: RouterFactory<
  TypelessNavigationState,
  NavigationAction,
  DefaultRouterOptions
> = () => ({
  getStateForDeclaredRoutes: (state) => state,
  getStateForRouteFocus: (state) => state,
  getStateForAction: (state) => ({
    state,
    affectedRouteKey: state.routes[state.index]?.key,
  }),
  shouldActionChangeFocus: () => false,
});

unstable_createStandardRouterNavigator(Content, TypelessRouter);

// A router may omit `type` only when its state has none.
export type _BaseRouterTypeIsOptional = Expect<
  Equal<Pick<Router<NavigationState, NavigationAction>, 'type'>, { type?: string }>
>;
export type _TypedRouterTypeIsOptional = Expect<
  Equal<Pick<Router<TabNavigationState<ParamListBase>, NavigationAction>, 'type'>, { type?: 'tab' }>
>;

export type _HasScreen = Expect<Equal<typeof Nav extends { Screen: unknown } ? true : false, true>>;
export type _HasProtected = Expect<
  Equal<typeof Nav extends { Protected: unknown } ? true : false, true>
>;

// ---------------------------------------------------------------------------
// screenListeners / screenOptions function form, derived from the navigator's own props
// ---------------------------------------------------------------------------

type Props = ComponentProps<typeof Nav>;

// ---------------------------------------------------------------------------
// initialRouteName is only supported through unstable_settings
// ---------------------------------------------------------------------------

export type _ElementLacksInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof Props ? true : false, false>
>;

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

const ExtendedIntegratedNav = unstable_integrateWithRouter<
  ExtendedOptions,
  TabState,
  EventMap,
  NavProps,
  TabRouterOptions
>(publicStandardNavigator, TabRouter, {
  processDescriptors: (descriptors, _state, describe) => {
    descriptors.index?.options.customOption satisfies number | undefined;
    describe({ key: 'generated', name: 'generated' }).options.customOption satisfies
      | number
      | undefined;
    return descriptors;
  },
  processScreens: (screens) =>
    screens.map((screen) => {
      if (typeof screen.options !== 'function') {
        screen.options?.customOption satisfies number | undefined;
      }
      return screen;
    }),
});

<ExtendedIntegratedNav.Screen name="index" options={{ title: 'Home', customOption: 123 }} />;
// @ts-expect-error Application-defined options retain their declared value type.
<ExtendedIntegratedNav.Screen name="index" options={{ customOption: '123' }} />;

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
  createProps: ({ isPreloaded, isRemovalPrevented }) => {
    isPreloaded('route-key') satisfies boolean;
    isRemovalPrevented('route-key') satisfies boolean;
    // @ts-expect-error Route keys are strings, not array indexes.
    isPreloaded(0);
    // @ts-expect-error Route keys are strings, not array indexes.
    isRemovalPrevented(0);
    return { routeNames: [], preload: () => {} };
  },
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
createSplitNav(SplitContent, TabRouter, { processScreens: (screens) => screens });

createPublicNav(PublicContent, TabRouter);

// ---------------------------------------------------------------------------
// processScreens is always optional and composes with createProps
// ---------------------------------------------------------------------------

type ProcessScreens = NonNullable<
  IntegrateWithRouterOptions<TabState, object, Opts, EventMap>['processScreens']
>;
export type _ProcessedScreenNameIsRequired = Expect<
  Equal<Parameters<ProcessScreens>[0][number]['name'], string>
>;

createPublicNav(PublicContent, TabRouter, { processScreens: (screens) => screens });

createSplitNav(SplitContent, TabRouter, {
  createProps: () => ({ routeNames: [], preload: () => {} }),
  processScreens: (screens) => screens.map((screen) => ({ ...screen, redirect: false })),
});

// The screens carry the navigator's own options, so reading an undeclared one is rejected.
createPublicNav(PublicContent, TabRouter, {
  processScreens: (screens) =>
    screens.map((screen) => {
      if (typeof screen.options !== 'function') {
        const title: string | undefined = screen.options?.title;
        // @ts-expect-error `badge` is not an option of this navigator.
        screen.options?.badge;
        return { ...screen, options: { title } };
      }
      return screen;
    }),
});

createPublicNav(PublicContent, TabRouter, {
  // @ts-expect-error `processScreens` must preserve every screen's name.
  processScreens: (screens) => screens.map(({ name, ...rest }) => rest),
});

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

const broadlyAnnotatedFactoryOptions: IntegrateWithRouterOptions<TabState, object, Opts, EventMap> =
  {
    // @ts-expect-error Bare options do not declare injected props, so `createProps` is forbidden.
    createProps: () => ({ injected: true }),
  };
unstable_createStandardRouterNavigator(PublicContent, TabRouter, broadlyAnnotatedFactoryOptions);

type CarrierCreateProps = { x: string };
function CarrierContent(_props: NavigatorContentProps<Opts, EventMap, object, CarrierCreateProps>) {
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

// ---------------------------------------------------------------------------
// unstable_integrateWithRouter infers a standard navigator's full contract
// ---------------------------------------------------------------------------

type CustomStackOptions = {
  title?: string;
  presentation?: 'card' | 'modal';
  requiresAuth?: boolean;
};
type CustomStackEventMap = {
  transitionStart: { data: { closing: boolean }; canPreventDefault: false };
  gestureCancel: { data: { reason: 'gesture' }; canPreventDefault: true };
};
type CustomStackPublicProps = { headerHeight: number; testID?: string };
type CustomStackCreateProps = {
  navigationState: StackNavigationState<ParamListBase>;
  navigateBack: () => void;
};
type CustomStackRouterOptions = StackRouterOptions & {
  backBehavior?: 'firstRoute' | 'history';
};

const CustomStackRouter: RouterFactory<
  StackNavigationState<ParamListBase>,
  NavigationAction,
  CustomStackRouterOptions
> = (options) => StackRouter(options);

function CustomStackContent(
  _props: NavigatorContentProps<
    CustomStackOptions,
    CustomStackEventMap,
    CustomStackPublicProps,
    CustomStackCreateProps
  >
) {
  return null;
}

const customStackNavigator = createStandardNavigator<
  CustomStackOptions,
  CustomStackEventMap,
  CustomStackPublicProps & CustomStackCreateProps
>(CustomStackContent);

const InferredIntegratedStack = unstable_integrateWithRouter(
  customStackNavigator,
  CustomStackRouter,
  {
    createProps: ({ state, navigation }) => {
      state satisfies StackNavigationState<ParamListBase>;
      return {
        navigationState: state,
        navigateBack: navigation.goBack,
      };
    },
    processScreens: (screens) =>
      screens.map((screen) => ({
        ...screen,
        options: { title: 'Custom', presentation: 'card' },
      })),
  }
);
type InferredIntegratedStackProps = ComponentProps<typeof InferredIntegratedStack>;

export type _IntegratedStackInfersPublicProps = Expect<
  Equal<InferredIntegratedStackProps['headerHeight'], number>
>;
export type _IntegratedStackInfersRouterOptions = Expect<
  Equal<InferredIntegratedStackProps['backBehavior'], 'firstRoute' | 'history' | undefined>
>;
type InferredStackListeners = Extract<
  InferredIntegratedStackProps['screenListeners'],
  (...args: never[]) => unknown
>;
export const _inferredStackListeners: InferredStackListeners = () => ({
  transitionStart: (event) => {
    event.data.closing satisfies boolean;
    // @ts-expect-error `transitionStart` cannot be prevented.
    event.preventDefault();
  },
  gestureCancel: (event) => {
    event.data.reason satisfies 'gesture';
    event.preventDefault();
  },
});
export type _IntegratedStackOmitsCreateProps = Expect<
  Equal<'navigationState' extends keyof InferredIntegratedStackProps ? true : false, false>
>;
export type _IntegratedStackOmitsInitialRouteName = Expect<
  Equal<'initialRouteName' extends keyof InferredIntegratedStackProps ? true : false, false>
>;

<InferredIntegratedStack headerHeight={44} />;
<InferredIntegratedStack headerHeight={44} backBehavior="history" />;
<InferredIntegratedStack.Screen
  name="index"
  options={{ presentation: 'modal', requiresAuth: true }}
/>;
<InferredIntegratedStack.Screen
  name="index"
  options={({ route }) => ({ title: route.name, requiresAuth: false })}
/>;
// @ts-expect-error Inferred screen options retain their declared value types.
<InferredIntegratedStack.Screen name="index" options={{ requiresAuth: 'yes' }} />;
// @ts-expect-error Public navigator props stay required after inference.
<InferredIntegratedStack />;
// @ts-expect-error Props supplied by `createProps` are not public navigator props.
<InferredIntegratedStack headerHeight={44} navigationState={{}} />;
// @ts-expect-error `initialRouteName` is configured through Expo Router settings.
<InferredIntegratedStack headerHeight={44} initialRouteName="index" />;

// @ts-expect-error `createProps` must return only props declared by the navigator.
unstable_integrateWithRouter(customStackNavigator, CustomStackRouter, {
  createProps: () => ({ unknownProp: true }),
});

unstable_integrateWithRouter(customStackNavigator, CustomStackRouter, {
  // @ts-expect-error `createProps` must return its complete inferred shape.
  createProps: (): CustomStackCreateProps => ({
    navigationState: {} as StackNavigationState<ParamListBase>,
  }),
});

// @ts-expect-error `createProps` must not add undeclared properties to an otherwise valid shape.
unstable_integrateWithRouter(customStackNavigator, CustomStackRouter, {
  createProps: ({ state, navigation }) => ({
    navigationState: state,
    navigateBack: navigation.goBack,
    extra: true,
  }),
});

const InferredIntegratedPublicStack = unstable_integrateWithRouter(
  publicStandardNavigator,
  CustomStackRouter
);
type InferredIntegratedPublicStackProps = ComponentProps<typeof InferredIntegratedPublicStack>;
export type _IntegratedWithoutCreatePropsInfersPublicProps = Expect<
  Equal<InferredIntegratedPublicStackProps['tintColor'], string | undefined>
>;
// @ts-expect-error The navigator does not declare this public prop.
<InferredIntegratedPublicStack badge="new" />;

// @ts-expect-error A navigator without injected props cannot gain them from `createProps`.
unstable_integrateWithRouter(publicStandardNavigator, CustomStackRouter, {
  createProps: () => ({ injected: true }),
});

describe('standard-navigation types', () => {
  it('is type-checked by tsc via pnpm typecheck or et check-packages', () => {
    expect(typeof unstable_createStandardRouterNavigator).toBe('function');
  });
});
