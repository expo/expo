import { act, screen } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { ExperimentalStack } from '../layouts/experimental-stack';
import { renderRouter } from '../testing-library';

jest.mock('react-native-screens/experimental', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens/experimental'
  ) as typeof import('react-native-screens/experimental');

  const Host = jest.fn(({ children }: { children: ReactNode }) => (
    <View testID="StackV5.Host">{children}</View>
  ));
  const Screen = jest.fn(({ children }: { children?: ReactNode }) => (
    <View testID="StackV5.Screen">{children}</View>
  ));
  const HeaderConfig = jest.fn(() => null);

  return {
    ...actual,
    Stack: {
      Host,
      Screen,
      HeaderConfig,
    },
  };
});

const { Stack: MockedStackV5 } = jest.requireMock(
  'react-native-screens/experimental'
) as typeof import('react-native-screens/experimental');

const MockedHost = MockedStackV5.Host as unknown as jest.Mock;
const MockedScreen = MockedStackV5.Screen as unknown as jest.Mock;
const MockedHeaderConfig = MockedStackV5.HeaderConfig as unknown as jest.Mock;

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

describe('ExperimentalStack — basic navigation', () => {
  it('renders Stack.Host and pushes new routes', () => {
    renderRouter(
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

    act(() => router.push('/b'));

    expect(screen).toHavePathname('/b');
    expect(router.canDismiss()).toBe(true);
  });

  it('pops via router.dismiss', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        c: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.push('/b'));
    act(() => router.push('/c'));
    expect(screen).toHavePathname('/c');

    act(() => router.dismiss());
    expect(screen).toHavePathname('/b');

    act(() => router.dismiss());
    expect(screen).toHavePathname('/a');
  });

  it('replaces with router.replace', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.replace('/b'));
    expect(screen).toHavePathname('/b');
    expect(router.canDismiss()).toBe(false);
  });
});

describe('ExperimentalStack — option mapping', () => {
  it('passes title to Stack.HeaderConfig', () => {
    renderRouter(
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

  it('maps headerShown=false to hidden=true', () => {
    renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack screenOptions={{ headerShown: false }} />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBe(true);
  });

  it('maps headerShown=true to hidden=false (explicit override)', () => {
    renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack screenOptions={{ headerShown: true }} />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBe(false);
  });

  it('leaves hidden undefined when headerShown is unset', () => {
    renderRouter(
      {
        a: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    const lastCallProps = MockedHeaderConfig.mock.calls.at(-1)![0];
    expect(lastCallProps.hidden).toBeUndefined();
  });

  it('passes headerTransparent and headerBackVisible through', () => {
    renderRouter(
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
  it('uses activityMode="attached" for the focused route', () => {
    renderRouter(
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

  it('passes route.key as screenKey', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.push('/b'));

    const props = screenPropsByKey();
    const keys = Object.keys(props);
    expect(keys.some((k) => k.startsWith('a-'))).toBe(true);
    expect(keys.some((k) => k.startsWith('b-'))).toBe(true);
  });
});

describe('ExperimentalStack — dismiss handlers', () => {
  it('does not subscribe to onDismiss — JS-initiated pops would otherwise double-pop', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.push('/b'));
    const propsB = MockedScreen.mock.calls
      .map((c) => c[0])
      .reverse()
      .find((p: any) => p.screenKey?.startsWith('b-'));

    expect(propsB).toBeDefined();
    expect(propsB.onDismiss).toBeUndefined();
  });

  it('does not log a useDismissedRouteError when JS pops the route', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderRouter(
        {
          a: () => null,
          b: () => null,
          _layout: () => <ExperimentalStack />,
        },
        { initialUrl: '/a' }
      );

      act(() => router.push('/b'));
      act(() => router.dismiss());
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

  it('onNativeDismiss pops and advances state', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.push('/b'));
    const propsB = MockedScreen.mock.calls
      .map((c) => c[0])
      .reverse()
      .find((p: any) => p.screenKey?.startsWith('b-'));

    act(() => {
      propsB.onNativeDismiss(propsB.screenKey);
    });

    expect(screen).toHavePathname('/a');
  });
});

describe('ExperimentalStack — unsupported option warning', () => {
  it('warns once for unsupported screenOptions', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      renderRouter(
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

  it('does not warn when only supported options are passed', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      renderRouter(
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
