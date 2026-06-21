/**
 * Integration tests that exercise the real `@react-navigation/native` pipeline
 */
import {
  createNavigatorFactory,
  StackRouter,
  TabRouter,
  useNavigationBuilder,
  type LinkingOptions,
  type NavigationContainerRef,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { act, fireEvent, render } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';
import { createRef } from 'react';
import { Pressable, Text } from 'react-native';

import { ObserveNavigationContainer } from '../ObserveNavigationContainer';
import { useObserveForReactNavigation } from '../useObserveForReactNavigation';

jest.mock('expo-app-metrics', () => {
  const mainSession = {
    id: 'session-1',
    type: 'main',
    startDate: '2026-01-01T00:00:00.000Z',
    addMetric: jest.fn(async () => {}),
  };
  return {
    __esModule: true,
    default: {
      markInteractive: jest.fn(),
      getMainSession: jest.fn(() => mainSession),
    },
  };
});

jest.mock('../init', () => ({
  __esModule: true,
  isInitialized: jest.fn(() => true),
  initReactNavigationIntegration: jest.fn(),
}));

const mockAddMetric = AppMetrics.getMainSession().addMetric as jest.Mock;
const mockMarkInteractive = AppMetrics.markInteractive as jest.Mock;

type EmittedMetric = {
  name: string;
  routeName: string;
  value: number;
  params: { isAppLaunch?: boolean; routeParams: object };
};

function emittedMetrics(name?: string): EmittedMetric[] {
  const all = mockAddMetric.mock.calls.map((call) => call[0] as EmittedMetric);
  return name ? all.filter((metric) => metric.name === name) : all;
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

// Minimal JS-only navigators built from react-navigation's public primitives.
// Rendering only the focused descriptor matches `lazy: true` tab navigators
// (the v7 default); the mounted-but-unfocused sibling case (`lazy: false`) is
// covered by the stateTraversal unit tests, not here.
function createTestNavigator(router: typeof StackRouter) {
  function TestNavigator({ initialRouteName, children }: any) {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(router, {
      children,
      initialRouteName,
    });
    const focused = state.routes[state.index]!;
    return <NavigationContent>{descriptors[focused.key]!.render()}</NavigationContent>;
  }
  return createNavigatorFactory(TestNavigator)();
}

const Stack = createTestNavigator(StackRouter);
const Tab = createTestNavigator(TabRouter as unknown as typeof StackRouter);

function PlainScreen({ title }: { title: string }) {
  return <Text>{title}</Text>;
}

const HomeScreen = () => <PlainScreen title="Home" />;
const DetailsScreen = () => <PlainScreen title="Details" />;
const FeedScreen = () => <PlainScreen title="Feed" />;
const ListScreen = () => <PlainScreen title="List" />;

function InteractiveDetailsScreen() {
  const markInteractive = useObserveForReactNavigation();
  return (
    <Pressable testID="mark" onPress={() => markInteractive?.()}>
      <Text>Details</Text>
    </Pressable>
  );
}

type SessionsParamList = {
  List: undefined;
  Details: { id: string };
};

type TabsParamList = {
  Feed: undefined;
  Sessions: NavigatorScreenParams<SessionsParamList> | undefined;
};

type RootParamList = {
  Home: { from?: string } | undefined;
  Details: { id: string };
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
};

type ContainerRef = NavigationContainerRef<RootParamList>;

// `enabled: false` keeps NavigationContainer from subscribing to URL handling
// in jest;
const linking: LinkingOptions<RootParamList> = {
  enabled: false,
  prefixes: [],
  config: {
    screens: {
      Home: 'home/:from?',
      Details: 'details/:id',
      Tabs: {
        path: 'tabs',
        screens: {
          Feed: 'feed',
          Sessions: {
            path: 'sessions/:sessionId?',
            screens: {
              List: 'list',
              Details: 'details/:id',
            },
          },
        },
      },
    },
  },
};

async function renderApp(children: React.ReactNode) {
  const ref = createRef<ContainerRef>();
  const result = render(
    <ObserveNavigationContainer ref={ref as never} linking={linking}>
      {children}
    </ObserveNavigationContainer>
  );
  // The initial cold metric fires from the provider's `isReady()` catch-up /
  // `state` ref listener and resolves an awaited `getMainSession()` before
  // emitting — flush microtasks before asserting.
  await act(async () => {
    await flushAsync();
  });
  return { ref, ...result };
}

async function navigate(ref: React.RefObject<ContainerRef | null>, name: string, params?: object) {
  await act(async () => {
    // The test navigates by dynamic name/params, so bypass the per-route
    // navigate() overloads with a loose call signature.
    const navigate = ref.current!.navigate as (name: string, params?: object) => void;
    navigate(name, params);
    await flushAsync();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('react-navigation integration (real navigation tree)', () => {
  describe('single stack', () => {
    function app() {
      return renderApp(
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} initialParams={{ from: 'launch' }} />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </Stack.Navigator>
      );
    }

    it('emits cold_ttr for the initial screen with a params-free routeName', async () => {
      await app();

      const [metric, ...rest] = emittedMetrics('cold_ttr');
      expect(rest).toHaveLength(0);
      expect(metric).toEqual({
        timestamp: expect.any(String),
        category: 'navigation',
        name: 'cold_ttr',
        routeName: '/Home',
        value: expect.any(Number),
        params: { isAppLaunch: true, routeParams: { from: 'launch' } },
      });
      expect(metric!.routeName).not.toContain('launch');
    });

    it('does not bake navigate() params into the routeName and reports them as routeParams', async () => {
      const { ref } = await app();

      await navigate(ref, 'Details', { id: 'abc' });

      const metric = emittedMetrics().at(-1)!;
      expect(metric.name).toBe('cold_ttr');
      expect(metric.routeName).toBe('/Details');
      expect(metric.routeName).not.toContain('abc');
      expect(metric.params).toEqual({ isAppLaunch: false, routeParams: { id: 'abc' } });
    });

    it('emits warm_ttr with a params-free routeName when revisiting a screen', async () => {
      const { ref } = await app();

      await navigate(ref, 'Details', { id: 'abc' });
      // goBack() refocuses the existing Home instance — navigate('Home') would
      // push a fresh instance in react-navigation 7, which is correctly cold.
      await act(async () => {
        ref.current!.goBack();
        await flushAsync();
      });

      const metric = emittedMetrics().at(-1)!;
      expect(metric.name).toBe('warm_ttr');
      expect(metric.routeName).toBe('/Home');
      expect(metric.params).toEqual({ isAppLaunch: false, routeParams: { from: 'launch' } });
    });
  });

  describe('nested navigators', () => {
    function SessionsNavigator() {
      return (
        <Stack.Navigator>
          <Stack.Screen name="List" component={ListScreen} />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </Stack.Navigator>
      );
    }

    function TabsNavigator() {
      return (
        <Tab.Navigator>
          <Tab.Screen name="Feed" component={FeedScreen} />
          <Tab.Screen name="Sessions" component={SessionsNavigator} />
        </Tab.Navigator>
      );
    }

    function app() {
      return renderApp(
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={TabsNavigator} />
        </Stack.Navigator>
      );
    }

    it('joins route names of the whole focused chain into the routeName', async () => {
      await app();

      const metric = emittedMetrics().at(-1)!;
      expect(metric.routeName).toBe('/Tabs/Feed');
    });

    it('keeps params of a deeply nested screen out of the routeName', async () => {
      const { ref } = await app();

      await navigate(ref, 'Tabs', {
        screen: 'Sessions',
        params: { screen: 'Details', params: { id: 'abc' } },
      });

      const metric = emittedMetrics().at(-1)!;
      expect(metric.routeName).toBe('/Tabs/Sessions/Details');
      expect(metric.routeName).not.toContain('abc');
      expect(metric.params.routeParams).toEqual({ id: 'abc' });
    });

    it('keeps params of an intermediate route out of the routeName', async () => {
      const { ref } = await app();

      // Param lands on the intermediate `Sessions` route; the focused leaf is
      // its initial `List` screen.
      await navigate(ref, 'Tabs', { screen: 'Sessions', params: { sessionId: 'abc' } });

      const metric = emittedMetrics().at(-1)!;
      expect(metric.routeName).toBe('/Tabs/Sessions/List');
      expect(metric.routeName).not.toContain('abc');
      // Only the focused leaf's params are reported; intermediate-route params
      // are not part of `routeParams`.
      expect(metric.params.routeParams).toEqual({});
    });
  });

  describe('tti via markInteractive', () => {
    it('emits tti and markInteractive with a params-free routeName', async () => {
      const { ref, getByTestId } = await renderApp(
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Details" component={InteractiveDetailsScreen} />
        </Stack.Navigator>
      );
      await navigate(ref, 'Details', { id: 'abc' });

      await act(async () => {
        fireEvent.press(getByTestId('mark'));
        await flushAsync();
      });

      expect(mockMarkInteractive).toHaveBeenCalledWith({ routeName: '/Details' });
      const [tti, ...rest] = emittedMetrics('tti');
      expect(rest).toHaveLength(0);
      expect(tti!.routeName).toBe('/Details');
      expect(tti!.routeName).not.toContain('abc');
      expect(tti!.params).toEqual({ routeParams: { id: 'abc' } });
    });
  });

  it('never includes any param value in any emitted routeName', async () => {
    const paramValues = ['launch', 'abc', 'xyz'];
    const { ref, getByTestId } = await renderApp(
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} initialParams={{ from: 'launch' }} />
        <Stack.Screen name="Details" component={InteractiveDetailsScreen} />
      </Stack.Navigator>
    );
    await navigate(ref, 'Details', { id: 'abc' });
    await act(async () => {
      fireEvent.press(getByTestId('mark'));
      await flushAsync();
    });
    await navigate(ref, 'Home', { from: 'xyz' });

    const routeNames = [
      ...emittedMetrics().map((metric) => metric.routeName),
      ...mockMarkInteractive.mock.calls.map((call) => call[0].routeName as string),
    ];
    // cold_ttr /Home, cold_ttr /Details, markInteractive + tti /Details,
    // cold_ttr /Home (navigate pushes a fresh instance in react-navigation 7).
    expect(routeNames).toHaveLength(5);
    for (const routeName of routeNames) {
      expect(routeName).toMatch(/^\//);
      for (const value of paramValues) {
        expect(routeName).not.toContain(value);
      }
    }
  });
});
