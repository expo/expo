import { act, fireEvent, screen } from '@testing-library/react-native';
import { useCallback, useEffect, type ReactNode } from 'react';
import { Button, Text, View, type NativeSyntheticEvent } from 'react-native';
import type { TabSelectedEvent, TabsHostProps } from 'react-native-screens';

import { useRouter } from '../../../../hooks';
import { router } from '../../../../imperative-api';
import JSStack from '../../../../layouts/JSStack';
import { Tabs } from '../../../../layouts/Tabs';
import { NativeTabs } from '../../../../native-tabs';
import { renderRouter } from '../../../../testing-library';
import { type ParamListBase, useFocusEffect, useIsFocused, useNavigation } from '../../../native';
import type { StackNavigationProp } from '../../types';

jest.mock('react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
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

afterEach(() => {
  jest.useRealTimers();
});

it('supports push, back, and replace through useRouter', async () => {
  function Index() {
    const navigation = useRouter();
    return <Button title="Push" onPress={() => navigation.push('/second')} />;
  }

  function Second() {
    const navigation = useRouter();
    return (
      <View testID="second">
        <Button testID="back" title="Back" onPress={() => navigation.back()} />
        <Button title="Replace" onPress={() => navigation.replace('/third')} />
      </View>
    );
  }

  await renderRouter({
    _layout: () => <JSStack />,
    index: Index,
    second: Second,
    third: () => <View testID="third" />,
  });

  expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  await fireEvent.press(screen.getByText('Push'));
  expect(screen).toHavePathname('/second');
  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.getByRole('button', { name: 'index, back' })).not.toBeNull();

  await fireEvent.press(screen.getAllByTestId('back').at(-1)!);
  await act(() => jest.runAllTimers());
  expect(screen).toHavePathname('/');

  await fireEvent.press(screen.getByText('Push'));
  await fireEvent.press(screen.getByText('Replace'));
  await act(() => jest.runAllTimers());
  expect(screen).toHavePathname('/third');
  expect(screen.getByTestId('third')).toBeVisible();
});

it('does not rerender the layout or screens after stack state changes', async () => {
  const layoutRender = jest.fn();
  const indexRender = jest.fn();
  const secondRender = jest.fn();

  await renderRouter({
    _layout: function Layout() {
      layoutRender();
      return <JSStack />;
    },
    index: function Index() {
      indexRender();
      return <View testID="index" />;
    },
    second: function Second() {
      secondRender();
      return <View testID="second" />;
    },
  });

  expect(layoutRender).toHaveBeenCalledTimes(1);
  expect(indexRender).toHaveBeenCalledTimes(1);
  expect(secondRender).not.toHaveBeenCalled();

  await act(() => router.push('/second'));
  expect(layoutRender).toHaveBeenCalledTimes(1);
  expect(indexRender).toHaveBeenCalledTimes(1);
  expect(secondRender).toHaveBeenCalledTimes(1);

  await act(() => router.back());
  await act(() => jest.runAllTimers());
  expect(layoutRender).toHaveBeenCalledTimes(1);
  expect(indexRender).toHaveBeenCalledTimes(1);
  expect(secondRender).toHaveBeenCalledTimes(1);
});

it('emits transition events when opening and closing a route', async () => {
  const events: { type: string; closing: boolean }[] = [];

  function Second() {
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    useEffect(() => {
      const unsubscribers = [
        navigation.addListener('transitionStart', (event) =>
          events.push({ type: 'start', closing: event.data.closing })
        ),
        navigation.addListener('transitionEnd', (event) =>
          events.push({ type: 'end', closing: event.data.closing })
        ),
      ];
      return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [navigation]);
    return <Button testID="back" title="Back" onPress={() => router.back()} />;
  }

  await renderRouter({
    _layout: () => <JSStack />,
    index: () => <Button title="Push" onPress={() => router.push('/second')} />,
    second: Second,
  });

  await fireEvent.press(screen.getByText('Push'));
  await act(() => jest.advanceTimersByTime(1));
  expect(events).toEqual([{ type: 'start', closing: false }]);
  await act(() => jest.runAllTimers());
  expect(events).toEqual([
    { type: 'start', closing: false },
    { type: 'end', closing: false },
  ]);

  await fireEvent.press(screen.getAllByTestId('back').at(-1)!);
  expect(events.at(-1)).toEqual({ type: 'start', closing: true });
  await act(() => jest.runAllTimers());
  expect(events.at(-1)).toEqual({ type: 'end', closing: true });
});

it('renders preloaded routes without focusing them', async () => {
  const focusEffect = jest.fn();
  const focusCleanup = jest.fn();

  function Second() {
    const focused = useIsFocused();
    useFocusEffect(
      useCallback(() => {
        focusEffect();
        return focusCleanup;
      }, [])
    );
    return <Text testID="focus-state">{focused ? 'focused' : 'unfocused'}</Text>;
  }

  await renderRouter({
    _layout: () => <JSStack />,
    index: () => <View testID="index" />,
    second: Second,
  });

  await act(() => router.prefetch('/second'));
  expect(screen.getByTestId('focus-state', { includeHiddenElements: true })).toHaveTextContent(
    'unfocused'
  );
  expect(focusEffect).not.toHaveBeenCalled();

  await act(() => router.push('/second'));
  expect(screen.getByTestId('focus-state')).toHaveTextContent('focused');
  expect(focusEffect).toHaveBeenCalledTimes(1);

  await act(() => router.back());
  expect(focusCleanup).toHaveBeenCalledTimes(1);
});

it('renders a back button in a nested JS stack', async () => {
  await renderRouter(
    {
      _layout: () => <JSStack screenOptions={{ headerShown: false }} />,
      'nested/_layout': () => <JSStack />,
      'nested/index': () => <Button title="Push" onPress={() => router.push('/nested/second')} />,
      'nested/second': () => <View testID="second" />,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  await fireEvent.press(screen.getByText('Push'));
  expect(screen.getByRole('button', { name: 'index, back' })).not.toBeNull();
});

it('pops to top when the focused JS tab is pressed again', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="home" />
        </Tabs>
      ),
      'home/_layout': () => <JSStack />,
      'home/index': () => <View testID="index" />,
      'home/second': () => <View testID="second" />,
    },
    { initialUrl: '/home' }
  );

  await act(() => router.push('/home/second'));
  await fireEvent.press(screen.getByRole('button', { name: 'home, tab, 1 of 1' }));
  await act(() => jest.runAllTimers());
  expect(screen).toHavePathname('/home');
});

it('does not pop to top for native tabPress events', async () => {
  await renderRouter(
    {
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="home" />
        </NativeTabs>
      ),
      'home/_layout': () => <JSStack />,
      'home/index': () => <View testID="index" />,
      'home/second': () => <View testID="second" />,
    },
    { initialUrl: '/home' }
  );

  await act(() => router.push('/home/second'));
  const screens = (
    jest.requireMock('react-native-screens') as typeof import('react-native-screens') & {
      __triggerTabSelected: (event: NativeSyntheticEvent<TabSelectedEvent>) => void;
    }
  ).Tabs.Screen as jest.MockedFunction<typeof import('react-native-screens').Tabs.Screen>;
  const homeTabKey = screens.mock.calls.at(-1)![0].screenKey!;
  await act(() =>
    (
      jest.requireMock('react-native-screens') as {
        __triggerTabSelected: (event: NativeSyntheticEvent<TabSelectedEvent>) => void;
      }
    ).__triggerTabSelected({
      nativeEvent: {
        selectedScreenKey: homeTabKey,
        provenance: 0,
        isRepeated: false,
        hasTriggeredSpecialEffect: false,
        actionOrigin: 'user',
      },
    } as NativeSyntheticEvent<TabSelectedEvent>)
  );
  await act(() => jest.runAllTimers());
  expect(screen).toHavePathname('/home/second');
});
