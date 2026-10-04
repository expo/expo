import { act, screen } from '@testing-library/react-native';
import { use, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Text, type NativeSyntheticEvent } from 'react-native';
import type { TabSelectedEvent, TabsHostProps } from 'react-native-screens';

import { router } from '../imperative-api';
import { ExperimentalStack } from '../layouts/experimental-stack';
import { NativeTabs } from '../native-tabs';
import { usePreventRemove } from '../react-navigation/native';
import { IsWithinNativeNavigator } from '../standard-navigation';
import { renderRouter } from '../testing-library';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual: typeof import('react-native-screens') = jest.requireActual('react-native-screens');
  let triggerTabSelected: NonNullable<TabsHostProps['onTabSelected']> = () => {};

  return {
    ...actual,
    Tabs: {
      ...actual.Tabs,
      Host: jest.fn(({ children, onTabSelected }: { children?: ReactNode } & TabsHostProps) => {
        triggerTabSelected = onTabSelected ?? (() => {});
        return <View testID="Tabs.Host">{children}</View>;
      }),
      Screen: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Tabs.Screen">{children}</View>
      )),
    },
    __triggerTabSelected: (event: Parameters<NonNullable<TabsHostProps['onTabSelected']>>[0]) =>
      triggerTabSelected(event),
  };
});

jest.mock('../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../optional-libraries/react-native-screens'
  ) as typeof import('../optional-libraries/react-native-screens');

  const Host = jest.fn(({ children }: { children: ReactNode }) => (
    <View testID="StackV5.Host">{children}</View>
  ));
  const Screen = jest.fn(({ children }: { children?: ReactNode }) => (
    <View testID="StackV5.Screen">{children}</View>
  ));
  const HeaderConfig = jest.fn(() => null);

  return {
    ...actual,
    StackV5: {
      Host,
      Screen,
      HeaderConfig,
    },
  };
});

const { StackV5: MockedStackV5 } = jest.requireMock(
  '../optional-libraries/react-native-screens'
) as typeof import('../optional-libraries/react-native-screens');

const MockedHost = MockedStackV5.Host as unknown as jest.Mock;
const MockedScreen = MockedStackV5.Screen as unknown as jest.Mock;
const MockedHeaderConfig = MockedStackV5.HeaderConfig as unknown as jest.Mock;
let warnSpy: jest.SpyInstance | undefined;

function NativeNavigatorContextProbe() {
  return <Text>{String(use(IsWithinNativeNavigator))}</Text>;
}

const screenPropsByKey = (): Record<string, any> => {
  const map: Record<string, any> = {};
  for (const call of MockedScreen.mock.calls) {
    const props = call[0];
    if (props?.screenKey) {
      map[props.screenKey] = props;
    }
  }
  return map;
};

const lastHeaderConfigsByTitle = (): Record<string, any> => {
  const map: Record<string, any> = {};
  for (const call of MockedHeaderConfig.mock.calls) {
    const props = call[0];
    if (props?.title) {
      map[props.title] = props;
    }
  }
  return map;
};

beforeEach(() => {
  MockedHost.mockClear();
  MockedScreen.mockClear();
  MockedHeaderConfig.mockClear();
});

afterEach(() => {
  warnSpy?.mockRestore();
  warnSpy = undefined;
});

describe('ExperimentalStack — basic navigation', () => {
  it('marks its routes as nested inside a native navigator', async () => {
    await renderRouter({
      _layout: () => <ExperimentalStack />,
      index: NativeNavigatorContextProbe,
    });

    expect(screen.getByText('true')).toBeVisible();
  });

  it('renders Stack.Host and pushes new routes', async () => {
    await renderRouter(
      {
        a: () => <Text testID="a">A</Text>,
        b: () => <Text testID="b">B</Text>,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    expect(MockedHost).toHaveBeenCalled();
    expect(screen).toHavePathname('/a');
    expect(router.canDismiss()).toBe(false);

    await act(() => router.push('/b'));

    expect(screen).toHavePathname('/b');
    expect(router.canDismiss()).toBe(true);
  });

  it('removes guarded routes from history when a guard flips false', async () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderRouter({
      _layout: function Layout() {
        const [guard, setState] = useState(true);
        setGuard = setState;
        return (
          <ExperimentalStack>
            <ExperimentalStack.Protected guard={guard}>
              <ExperimentalStack.Screen name="secret" />
            </ExperimentalStack.Protected>
            <ExperimentalStack.Screen name="other" />
          </ExperimentalStack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      secret: () => <Text testID="secret">secret</Text>,
      other: () => <Text testID="other">other</Text>,
    });

    await act(() => router.push('/secret'));
    await act(() => router.push('/other'));
    await act(() => setGuard(false));
    await act(() => router.back());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("ignoring unsupported screenOption 'hidden'")
    );
    expect(screen).toHavePathname('/');
    expect(router.canGoBack()).toBe(false);
  });

  it('pops via router.dismiss', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        c: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.push('/b'));
    await act(() => router.push('/c'));
    expect(screen).toHavePathname('/c');

    await act(() => router.dismiss());
    expect(screen).toHavePathname('/b');

    await act(() => router.dismiss());
    expect(screen).toHavePathname('/a');
  });

  it('replaces with router.replace', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.replace('/b'));
    expect(screen).toHavePathname('/b');
    expect(router.canDismiss()).toBe(false);
  });

  it('does not pop to top for native tabPress events', async () => {
    await renderRouter(
      {
        _layout: () => (
          <NativeTabs>
            <NativeTabs.Trigger name="home" />
          </NativeTabs>
        ),
        'home/_layout': () => <ExperimentalStack />,
        'home/index': () => null,
        'home/second': () => null,
      },
      { initialUrl: '/home' }
    );

    await act(() => router.push('/home/second'));
    const mockedScreens: typeof import('react-native-screens') & {
      __triggerTabSelected: (event: NativeSyntheticEvent<TabSelectedEvent>) => void;
      Tabs: {
        Screen: jest.MockedFunction<typeof import('react-native-screens').Tabs.Screen>;
      };
    } = jest.requireMock('react-native-screens');
    const homeTabKey = mockedScreens.Tabs.Screen.mock.calls.at(-1)![0].screenKey!;
    await act(() =>
      mockedScreens.__triggerTabSelected({
        nativeEvent: {
          selectedScreenKey: homeTabKey,
          provenance: 0,
          isRepeated: false,
          hasTriggeredSpecialEffect: false,
          actionOrigin: 'user',
        },
        // React Native's synthetic event has runtime fields irrelevant to this callback.
      } as NativeSyntheticEvent<TabSelectedEvent>)
    );
    await act(() => jest.runAllTimers());
    expect(screen).toHavePathname('/home/second');
  });
});

describe('ExperimentalStack — option mapping', () => {
  it('passes title to Stack.HeaderConfig', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack screenOptions={{ title: 'Hello' }} />,
      },
      { initialUrl: '/a' }
    );

    const headerProps = lastHeaderConfigsByTitle()['Hello'];
    expect(headerProps).toBeDefined();
    expect(headerProps.title).toBe('Hello');
  });

  it('maps headerShown=false to hidden=true', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack screenOptions={{ headerShown: false }} />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBe(true);
  });

  it('maps headerShown=true to hidden=false (explicit override)', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack screenOptions={{ headerShown: true }} />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBe(false);
  });

  it('leaves hidden undefined when headerShown is unset', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBeUndefined();
  });

  it('passes headerTransparent and headerBackVisible through', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => (
          <ExperimentalStack
            screenOptions={{ headerTransparent: true, headerBackVisible: false }}
          />
        ),
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.transparent).toBe(true);
    expect(lastCallProps.backButtonHidden).toBe(true);
  });
});

describe('ExperimentalStack — Screen activityMode', () => {
  it('uses activityMode="attached" for the focused route', async () => {
    await renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    const screens = MockedScreen.mock.calls.map((c) => c[0]);
    expect(screens.length).toBeGreaterThan(0);
    expect(screens.every((s: any) => s.activityMode === 'attached')).toBe(true);
  });

  it('passes route.key as screenKey', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.push('/b'));

    const props = screenPropsByKey();
    const keys = Object.keys(props);
    expect(keys.some((k) => k.startsWith('a:'))).toBe(true);
    expect(keys.some((k) => k.startsWith('b:'))).toBe(true);
  });

  it('detaches preloaded routes until they are focused', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.prefetch('/b'));

    const preloaded = Object.entries(screenPropsByKey()).find(([key]) => key.startsWith('b:'))?.[1];
    expect(preloaded?.activityMode).toBe('detached');

    await act(() => router.push('/b'));

    const focused = Object.entries(screenPropsByKey()).find(([key]) => key.startsWith('b:'))?.[1];
    expect(focused?.activityMode).toBe('attached');
  });
});

describe('ExperimentalStack — dismiss handlers', () => {
  it('does not subscribe to onDismiss — JS-initiated pops would otherwise double-pop', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.push('/b'));
    const propsB = MockedScreen.mock.calls
      .map((c) => c[0])
      .reverse()
      .find((p: any) => p.screenKey?.startsWith('b:'));

    expect(propsB).toBeDefined();
    expect(propsB.onDismiss).toBeUndefined();
  });

  it('does not log a useDismissedRouteError when JS pops the route', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await renderRouter(
        {
          a: () => null,
          b: () => null,
          _layout: () => <ExperimentalStack />,
        },
        { initialUrl: '/a' }
      );

      await act(() => router.push('/b'));
      await act(() => router.dismiss());
      expect(screen).toHavePathname('/a');

      const stuck = errSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes("was removed natively but didn't get removed from JS state")
      );
      expect(stuck).toBeUndefined();
    } finally {
      errSpy.mockRestore();
    }
  });

  it('onNativeDismiss pops and advances state', async () => {
    await renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.push('/b'));
    const propsB = MockedScreen.mock.calls
      .map((c) => c[0])
      .reverse()
      .find((p: any) => p.screenKey?.startsWith('b:'));

    await act(() => {
      propsB.onNativeDismiss(propsB.screenKey);
    });

    expect(screen).toHavePathname('/a');
  });

  it('onNativeDismissPrevented warns without prevention context', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await renderRouter(
        {
          a: () => null,
          b: () => null,
          _layout: () => <ExperimentalStack />,
        },
        { initialUrl: '/a' }
      );

      await act(() => router.push('/b'));
      const propsB = MockedScreen.mock.calls
        .map((call) => call[0])
        .reverse()
        .find((props: any) => props.screenKey?.startsWith('b:'));

      expect(propsB.preventNativeDismiss).toBe(false);
      await act(() => propsB.onNativeDismissPrevented());

      expect(screen).toHavePathname('/b');
      expect(warn).toHaveBeenCalledWith(
        "ExperimentalStack received `onNativeDismissPrevented` for route 'b' without an active removal guard. The dismiss action was ignored because prevention context and native state are out of sync."
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('onNativeDismissPrevented dispatches a pop through nested prevention', async () => {
    const onPreventRemove = jest.fn();
    const onGestureCancel = jest.fn();
    const ProtectedScreen = () => {
      usePreventRemove(true, ({ data }) => onPreventRemove(data.action));
      return null;
    };
    const RootLayout = () => (
      <ExperimentalStack screenListeners={{ gestureCancel: onGestureCancel }} />
    );

    await renderRouter(
      {
        a: () => null,
        _layout: RootLayout,
        'nested/_layout': () => <ExperimentalStack />,
        'nested/index': ProtectedScreen,
      },
      { initialUrl: '/a' }
    );

    await act(() => router.push('/nested'));
    const propsNested = MockedScreen.mock.calls
      .map((call) => call[0])
      .reverse()
      .find((props: any) => props.screenKey?.startsWith('nested:'));

    expect(propsNested.preventNativeDismiss).toBe(true);
    await act(() => propsNested.onNativeDismissPrevented());

    expect(screen).toHavePathname('/nested');
    expect(onPreventRemove).toHaveBeenCalledWith({
      payload: { count: 1 },
      source: propsNested.screenKey,
      target: expect.any(String),
      type: 'POP',
    });
    expect(onGestureCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ExperimentalStack — unsupported option warning', () => {
  it('warns once for unsupported screenOptions', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await renderRouter(
        {
          a: () => null,
          _layout: () => (
            <ExperimentalStack
              screenOptions={
                {
                  presentation: 'modal',
                  animation: 'fade',
                } as any
              }
            />
          ),
        },
        { initialUrl: '/a' }
      );

      const matched = warnSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('ExperimentalStack: ignoring unsupported screenOption')
      );
      expect(matched).toBeDefined();
      expect(matched?.[0]).toContain("'presentation'");
      expect(matched?.[0]).toContain("'animation'");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn when only supported options are passed', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await renderRouter(
        {
          a: () => null,
          _layout: () => (
            <ExperimentalStack
              screenOptions={{
                title: 'Hello',
                headerShown: true,
                headerTransparent: false,
                headerBackVisible: true,
              }}
            />
          ),
        },
        { initialUrl: '/a' }
      );

      const matched = warnSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('ExperimentalStack: ignoring unsupported screenOption')
      );
      expect(matched).toBeUndefined();
    } finally {
      warnSpy.mockRestore();
    }
  });
});
