import { act, fireEvent } from '@testing-library/react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import { router } from '../../imperative-api';
import { useLinkPreviewContext } from '../../link/preview/LinkPreviewContext';
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

describe('navigation basics', () => {
  it('renders the initial route and navigates with push/replace/back', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');

    act(() => router.push('/second'));
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen).toHavePathname('/second');

    act(() => router.replace('/third'));
    expect(screen.getByTestId('third')).toBeVisible();
    expect(screen).toHavePathname('/third');

    // `replace` replaced `second`, so back lands on the initial route
    act(() => router.back());
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
  });
});

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

  it('pops `dismissCount` screens through a modal chain while a preloaded modal stays inactive', () => {
    renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sheet" options={{ presentation: 'formSheet' }} />
          <Stack.Screen name="preloaded-modal" options={{ presentation: 'modal' }} />
        </Stack>
      ),
      index: () => <View testID="index" />,
      modal: () => <View testID="modal" />,
      sheet: () => <View testID="sheet" />,
      'preloaded-modal': () => <View testID="preloaded-modal" />,
    });

    act(() => router.push('/modal'));
    act(() => router.push('/sheet'));
    act(() => router.prefetch('/preloaded-modal'));
    expect(screen).toHavePathname('/sheet');
    expect(latestStackItemProps('preloaded-modal')?.activityState).toBe(0);

    const props = latestStackItemProps('sheet');
    act(() =>
      props!.onDismissed!({
        nativeEvent: { dismissCount: 2 },
      } as Parameters<NonNullable<StackItemProps['onDismissed']>>[0])
    );

    expect(screen).toHavePathname('/');
    expect(screen.getByTestId('index')).toBeVisible();
    // The preloaded modal is untouched by the dismissal
    expect(latestStackItemProps('preloaded-modal')?.activityState).toBe(0);
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

describe('preloading', () => {
  it('renders a prefetched route as an inactive screen', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(latestStackItemProps('second')).toBeUndefined();

    act(() => router.prefetch('/second'));

    // Still on the initial route, but the preloaded screen is rendered natively-inactive
    expect(screen).toHavePathname('/');
    const preloadedProps = latestStackItemProps('second');
    expect(preloadedProps?.activityState).toBe(0);
    expect(screen.getByTestId('second', { includeHiddenElements: true })).toBeDefined();

    // The focused screen stays active
    expect(latestStackItemProps('index')?.activityState).toBe(2);
  });

  it('keeps the projection consistent when pushing one of two preloaded routes', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    act(() => router.prefetch('/second'));
    act(() => router.prefetch('/third'));

    const preloadedThirdKey = latestStackItemProps('third')!.screenId;
    expect(latestStackItemProps('second')?.activityState).toBe(0);
    expect(latestStackItemProps('third')?.activityState).toBe(0);

    act(() => router.push('/third'));

    // The pushed route reuses the preloaded screen and becomes active
    expect(screen).toHavePathname('/third');
    const thirdProps = latestStackItemProps('third');
    expect(thirdProps?.screenId).toBe(preloadedThirdKey);
    expect(thirdProps?.activityState).toBe(2);
    // The other preloaded route stays inactive
    expect(latestStackItemProps('second')?.activityState).toBe(0);
  });

  it('reuses the preloaded screen when navigating to a prefetched route', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.prefetch('/second'));
    const preloadedKey = latestStackItemProps('second')!.screenId;

    act(() => router.navigate('/second'));

    expect(screen).toHavePathname('/second');
    const props = latestStackItemProps('second');
    expect(props?.screenId).toBe(preloadedKey);
    expect(props?.activityState).toBe(2);
  });
});

describe('preview transition', () => {
  it('promotes the previewed preloaded screen during the native transition window', () => {
    let setOpenPreviewKey: ((key: string | undefined) => void) | undefined;
    let openPreviewKey: string | undefined;

    function Index() {
      const context = useLinkPreviewContext();
      setOpenPreviewKey = context.setOpenPreviewKey;
      openPreviewKey = context.openPreviewKey;
      return <View testID="index" />;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
      second: () => <View testID="second" />,
    });

    act(() => router.prefetch('/second'));

    const previewKey = latestStackItemProps('second')!.screenId as string;
    expect(latestStackItemProps('second')?.activityState).toBe(0);

    // The link preview was committed on the native side
    act(() => setOpenPreviewKey!(previewKey));

    // Native side starts presenting the previewed screen
    const propsAfterOpen = latestStackItemProps('second');
    act(() => propsAfterOpen!.onWillAppear!({} as never));

    // The previewed screen is now treated as the focused route while
    // react-navigation state catches up
    expect(latestStackItemProps('second')?.activityState).toBe(2);

    // Native side finished the transition → preview tracking is released
    act(() => latestStackItemProps('second')!.onAppear!({} as never));
    expect(openPreviewKey).toBeUndefined();
  });

  it('promotes the previewed screen while another preloaded route stays inactive', () => {
    let setOpenPreviewKey: ((key: string | undefined) => void) | undefined;

    function Index() {
      const context = useLinkPreviewContext();
      setOpenPreviewKey = context.setOpenPreviewKey;
      return <View testID="index" />;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
      second: () => <View testID="second" />,
      third: () => <View testID="third" />,
    });

    // `second` ends up after `third` in the preloaded tail (the newest preload goes first),
    // so promoting it exercises the reordering path of the preview transition
    act(() => router.prefetch('/second'));
    act(() => router.prefetch('/third'));

    const previewKey = latestStackItemProps('second')!.screenId as string;

    act(() => setOpenPreviewKey!(previewKey));
    act(() => latestStackItemProps('second')!.onWillAppear!({} as never));

    // The previewed screen is treated as focused, the other preload stays inactive
    expect(latestStackItemProps('second')?.activityState).toBe(2);
    expect(latestStackItemProps('third')?.activityState).toBe(0);
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

    jest.useRealTimers();
  });
});
