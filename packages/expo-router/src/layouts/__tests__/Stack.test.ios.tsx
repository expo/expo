import { act, fireEvent } from '@testing-library/react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import { router } from '../../imperative-api';
import type { ParamListBase } from '../../react-navigation/native';
import type { NativeStackNavigationProp } from '../../react-navigation/native-stack';
import { renderRouter, screen } from '../../testing-library';
import { useNavigation } from '../../useNavigation';
import Stack from '../Stack';
import Tabs from '../Tabs';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const { ScreenStackItem } = jest.requireMock(
  'react-native-screens'
) as typeof import('react-native-screens');
const MockedScreenStackItem = ScreenStackItem as jest.MockedFunction<typeof ScreenStackItem>;

type StackItemProps = Parameters<typeof ScreenStackItem>[0];

/** Latest rendered props of the `ScreenStackItem` whose route key starts with `${routeName}-`. */
function latestStackItemProps(routeName: string): StackItemProps | undefined {
  return MockedScreenStackItem.mock.calls
    .map((call) => call[0])
    .filter(
      (props) => typeof props.screenId === 'string' && props.screenId.startsWith(`${routeName}-`)
    )
    .at(-1);
}

beforeEach(() => {
  MockedScreenStackItem.mockClear();
});

afterEach(() => jest.useRealTimers());

describe('native dismissal', () => {
  it('pops one screen when the native header back button is clicked', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.push('/second'));
    expect(screen).toHavePathname('/second');

    const props = latestStackItemProps('second');
    expect(props?.onHeaderBackButtonClicked).toBeDefined();
    act(() => props!.onHeaderBackButtonClicked!());

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('pops `dismissCount` screens on native dismiss', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    act(() => router.push('/second'));
    act(() => router.push('/third'));
    expect(screen).toHavePathname('/third');

    const props = latestStackItemProps('third');
    act(() =>
      props!.onDismissed!({
        nativeEvent: { dismissCount: 2 },
      } as Parameters<NonNullable<StackItemProps['onDismissed']>>[0])
    );

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('pops the dismissed screen when a native dismiss is cancelled-then-completed', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.push('/second'));

    const props = latestStackItemProps('second');
    act(() =>
      props!.onNativeDismissCancelled!({
        nativeEvent: { dismissCount: 1 },
      } as Parameters<NonNullable<StackItemProps['onDismissed']>>[0])
    );

    expect(screen).toHavePathname('/');
  });
});

describe('screen lifecycle events', () => {
  it('emits transition and sheet events targeted at the screen', () => {
    const events: { type: string; data?: unknown }[] = [];

    function Second() {
      const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
      useEffect(() => {
        const unsubscribers = [
          navigation.addListener('transitionStart', (e) =>
            events.push({ type: 'transitionStart', data: e.data })
          ),
          navigation.addListener('transitionEnd', (e) =>
            events.push({ type: 'transitionEnd', data: e.data })
          ),
          navigation.addListener('gestureCancel', () => events.push({ type: 'gestureCancel' })),
          navigation.addListener('sheetDetentChange', (e) =>
            events.push({ type: 'sheetDetentChange', data: e.data })
          ),
        ];
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
      }, [navigation]);
      return <View testID="second" />;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: Second,
    });

    act(() => router.push('/second'));

    const props = latestStackItemProps('second');
    act(() => props!.onWillAppear!({} as never));
    act(() => props!.onAppear!({} as never));
    act(() => props!.onWillDisappear!({} as never));
    act(() => props!.onDisappear!({} as never));
    act(() => props!.onGestureCancel!({} as never));
    act(() =>
      props!.onSheetDetentChanged!({
        nativeEvent: { index: 1, isStable: true },
      } as Parameters<NonNullable<StackItemProps['onSheetDetentChanged']>>[0])
    );

    expect(events).toEqual([
      { type: 'transitionStart', data: { closing: false } },
      { type: 'transitionEnd', data: { closing: false } },
      { type: 'transitionStart', data: { closing: true } },
      { type: 'transitionEnd', data: { closing: true } },
      { type: 'gestureCancel' },
      { type: 'sheetDetentChange', data: { index: 1, stable: true } },
    ]);
  });
});

describe('tabPress', () => {
  it('pops the stack to top when the focused tab is pressed again', () => {
    jest.useFakeTimers();

    renderRouter(
      {
        _layout: () => <Tabs />,
        'a/_layout': () => <Stack />,
        'a/index': () => <View testID="a-index" />,
        'a/b': () => <View testID="a-b" />,
      },
      { initialUrl: '/a' }
    );

    expect(screen.getByTestId('a-index')).toBeVisible();

    act(() => router.push('/a/b'));
    expect(screen).toHavePathname('/a/b');

    // Press the already-focused tab (the tab bar item is the only button named "a");
    // the handler resets the stack on the next frame
    fireEvent.press(screen.getByRole('button', { name: 'a' }));
    act(() => {
      jest.runAllTimers();
    });

    expect(screen).toHavePathname('/a');
    expect(screen.getByTestId('a-index')).toBeVisible();
  });
});
