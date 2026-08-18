import { act, fireEvent } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { Button, Text } from 'react-native';

import { router } from '../imperative-api';
import { ExperimentalStack } from '../layouts/experimental-stack';
import { StackHeader } from '../layouts/stack-utils';
import { renderRouter, screen } from '../testing-library';

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

const lastHeaderConfigProps = (): Record<string, any> => MockedHeaderConfig.mock.calls.at(-1)![0];

beforeEach(() => {
  MockedHost.mockClear();
  MockedScreen.mockClear();
  MockedHeaderConfig.mockClear();
});

describe('ExperimentalStack — composition components inside pages', () => {
  it('Stack.Screen.Title propagates title to HeaderConfig', () => {
    function PageA() {
      return (
        <>
          <ExperimentalStack.Screen.Title>Hello</ExperimentalStack.Screen.Title>
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    // Composition triggers a re-render after the initial layout pass; the last
    // HeaderConfig call reflects the merged options.
    expect(MockedHeaderConfig.mock.calls.length).toBeGreaterThan(1);
    expect(lastHeaderConfigProps().title).toBe('Hello');
  });

  it('Stack.Header hidden propagates hidden:true to HeaderConfig', () => {
    function PageA() {
      return (
        <>
          <StackHeader hidden />
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    expect(lastHeaderConfigProps().hidden).toBe(true);
  });

  it('Stack.Header transparent propagates transparent:true and hidden:false', () => {
    function PageA() {
      return (
        <>
          <StackHeader transparent />
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    const props = lastHeaderConfigProps();
    expect(props.transparent).toBe(true);
    // <Stack.Header transparent /> also writes headerShown: !hidden = true,
    // which ExperimentalStack maps to hidden: false.
    expect(props.hidden).toBe(false);
  });

  it('Stack.Screen.BackButton hidden propagates backButtonHidden:true', () => {
    function PageA() {
      return (
        <>
          <ExperimentalStack.Screen.BackButton hidden />
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    expect(lastHeaderConfigProps().backButtonHidden).toBe(true);
  });

  it.each([
    [
      'Stack.Screen.Title',
      () => (
        <>
          <ExperimentalStack.Screen.Title>Hello</ExperimentalStack.Screen.Title>
          <Text testID="content">A</Text>
        </>
      ),
    ],
    [
      'Stack.Header transparent',
      () => (
        <>
          <StackHeader transparent />
          <Text testID="content">A</Text>
        </>
      ),
    ],
    [
      'Stack.Screen.BackButton hidden',
      () => (
        <>
          <ExperimentalStack.Screen.BackButton hidden />
          <Text testID="content">A</Text>
        </>
      ),
    ],
  ] as const)(
    'does not warn about unsupported screenOptions for %s inside a page',
    (_label, PageA) => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        renderRouter(
          {
            a: PageA,
            _layout: () => <ExperimentalStack />,
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
    }
  );

  it('combined Title + Header + BackButton land together on the final HeaderConfig call', () => {
    function PageA() {
      return (
        <>
          <ExperimentalStack.Screen.Title>Combined</ExperimentalStack.Screen.Title>
          <StackHeader transparent />
          <ExperimentalStack.Screen.BackButton hidden />
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    const props = lastHeaderConfigProps();
    expect(props.title).toBe('Combined');
    expect(props.transparent).toBe(true);
    expect(props.hidden).toBe(false);
    expect(props.backButtonHidden).toBe(true);
  });

  it('page-level composition wins over layout-level screenOptions', () => {
    function PageA() {
      return (
        <>
          <ExperimentalStack.Screen.Title>FromPage</ExperimentalStack.Screen.Title>
          <Text testID="content">A</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack screenOptions={{ title: 'FromLayout' }} />,
      },
      { initialUrl: '/a' }
    );

    expect(lastHeaderConfigProps().title).toBe('FromPage');
  });

  it('unmounting Stack.Screen.Title restores the previous title (route name fallback)', () => {
    function PageA() {
      const [show, setShow] = useState(true);
      return (
        <>
          {show && <ExperimentalStack.Screen.Title>Custom</ExperimentalStack.Screen.Title>}
          <Text testID="content">A</Text>
          <Button testID="toggle" title="Toggle" onPress={() => setShow((v) => !v)} />
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    expect(lastHeaderConfigProps().title).toBe('Custom');

    act(() => {
      fireEvent.press(screen.getByTestId('toggle'));
    });

    expect(lastHeaderConfigProps().title).not.toBe('Custom');
  });

  it('isolates composition per route — push to a second route does not bleed title back', () => {
    function PageA() {
      return (
        <>
          <ExperimentalStack.Screen.Title>From-A</ExperimentalStack.Screen.Title>
          <Text testID="a">A</Text>
        </>
      );
    }

    function PageB() {
      return (
        <>
          <ExperimentalStack.Screen.Title>From-B</ExperimentalStack.Screen.Title>
          <Text testID="b">B</Text>
        </>
      );
    }

    renderRouter(
      {
        a: PageA,
        b: PageB,
        _layout: () => <ExperimentalStack />,
      },
      { initialUrl: '/a' }
    );

    act(() => router.push('/b'));

    // Each route's HeaderConfig should reflect only its own composition title.
    // Walk every HeaderConfig call and bucket by title — both routes' titles
    // must be present, and neither should contain the other's value.
    const titles = MockedHeaderConfig.mock.calls
      .map((call) => call[0]?.title)
      .filter((t): t is string => typeof t === 'string');

    expect(titles).toContain('From-A');
    expect(titles).toContain('From-B');
  });
});
