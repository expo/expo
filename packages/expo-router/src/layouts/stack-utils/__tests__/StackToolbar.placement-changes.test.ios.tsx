import { act } from '@testing-library/react-native';
import { Dispatch, SetStateAction, useState } from 'react';
import { Text } from 'react-native';
import {
  type HeaderBarButtonItemWithAction,
  ScreenStackItem as _ScreenStackItem,
} from 'react-native-screens';

import { router } from '../../../imperative-api';
import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const MockedRouterToolbarHost = jest.fn(({ children }) => <>{children}</>);
const MockedRouterToolbarItem = jest.fn(({ children }) => <>{children}</>);

jest.mock('../../../toolbar/native', () => {
  return {
    RouterToolbarHost: (props: any) => MockedRouterToolbarHost(props),
    RouterToolbarItem: (props: any) => MockedRouterToolbarItem(props),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

let consoleWarnMock: jest.SpyInstance;
beforeEach(() => {
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  consoleWarnMock.mockRestore();
});

describe('Stack.Toolbar dynamic placement changes', () => {
  it('left to right: clears headerLeftBarButtonItems and populates headerRightBarButtonItems', () => {
    let setPlacement: Dispatch<SetStateAction<'left' | 'right'>>;

    function TestScreen() {
      const [placement, _setPlacement] = useState<'left' | 'right'>('left');
      setPlacement = _setPlacement;
      return (
        <>
          <Stack.Toolbar placement={placement}>
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="content">Content</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: TestScreen,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Render sequence:
    // [0] Initial layout render (no toolbar options yet)
    // [1] Screen component renders, toolbar sets left items via composition registry
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    const headerConfig = ScreenStackItem.mock.calls[1][0].headerConfig;
    expect(headerConfig?.headerLeftBarButtonItems).toHaveLength(1);
    expect(
      (headerConfig?.headerLeftBarButtonItems?.[0] as HeaderBarButtonItemWithAction).icon
    ).toEqual({
      type: 'sfSymbol',
      name: 'star',
    });

    jest.clearAllMocks();

    act(() => setPlacement!('right'));

    // Render sequence after placement change:
    // Composition cleanup removes left items, right toolbar registers new items
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);

    const headerConfigAfter = ScreenStackItem.mock.calls[0][0].headerConfig;
    expect(headerConfigAfter?.headerLeftBarButtonItems).toBeUndefined();
    expect(headerConfigAfter?.headerRightBarButtonItems).toHaveLength(1);
    expect(
      (headerConfigAfter!.headerRightBarButtonItems![0] as HeaderBarButtonItemWithAction).icon
    ).toEqual({
      type: 'sfSymbol',
      name: 'star',
    });
  });

  it('left to bottom: clears headerLeftBarButtonItems and uses RouterToolbarHost', () => {
    let setPlacement: Dispatch<SetStateAction<'left' | 'bottom'>>;

    function TestScreen() {
      const [placement, _setPlacement] = useState<'left' | 'bottom'>('left');
      setPlacement = _setPlacement;
      return (
        <>
          <Stack.Toolbar placement={placement}>
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="content">Content</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: TestScreen,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Render sequence:
    // [0] Initial layout render
    // [1] Screen component renders with left toolbar options
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.headerLeftBarButtonItems).toHaveLength(1);

    // Bottom toolbar uses RouterToolbarHost, not called yet
    expect(MockedRouterToolbarHost).not.toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => setPlacement!('bottom'));

    // Bottom toolbar renders via RouterToolbarHost
    expect(MockedRouterToolbarHost).toHaveBeenCalledTimes(1);

    // RouterToolbarItem is called with correct icon (systemImageName for SF Symbol)
    expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
    expect(MockedRouterToolbarItem.mock.calls[0][0].systemImageName).toBe('star');

    // Render sequence after placement change:
    // Composition cleanup removes headerLeftBarButtonItems
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerLeftBarButtonItems).toBeUndefined();
  });

  it('bottom to right: stops using RouterToolbarHost and populates headerRightBarButtonItems', () => {
    let setPlacement: Dispatch<SetStateAction<'bottom' | 'right'>>;

    function TestScreen() {
      const [placement, _setPlacement] = useState<'bottom' | 'right'>('bottom');
      setPlacement = _setPlacement;
      return (
        <>
          <Stack.Toolbar placement={placement}>
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="content">Content</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: TestScreen,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Initial render with bottom placement uses RouterToolbarHost
    expect(MockedRouterToolbarHost).toHaveBeenCalledTimes(1);

    // RouterToolbarItem is called with correct icon (systemImageName for SF Symbol)
    expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
    expect(MockedRouterToolbarItem.mock.calls[0][0].systemImageName).toBe('star');

    // No header bar button items should be set (bottom doesn't use them)
    // All initial calls should have no right bar button items
    expect(
      ScreenStackItem.mock.calls.every(
        (call) =>
          !call[0].headerConfig?.headerRightBarButtonItems ||
          call[0].headerConfig.headerRightBarButtonItems.length === 0
      )
    ).toBe(true);

    jest.clearAllMocks();

    act(() => setPlacement!('right'));

    // Render sequence after placement change:
    // [0] Right toolbar sets headerRightBarButtonItems
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    const headerConfigAfter = ScreenStackItem.mock.calls[0][0].headerConfig;
    expect(headerConfigAfter?.headerRightBarButtonItems).toHaveLength(1);
    expect(
      (headerConfigAfter!.headerRightBarButtonItems![0] as HeaderBarButtonItemWithAction).icon
    ).toEqual({
      type: 'sfSymbol',
      name: 'star',
    });

    // RouterToolbarHost not called after switching away from bottom
    expect(MockedRouterToolbarHost).not.toHaveBeenCalled();
  });

  it('cycles correctly through left -> right -> bottom -> left', () => {
    let setPlacement: Dispatch<SetStateAction<'left' | 'right' | 'bottom'>>;

    function TestScreen() {
      const [placement, _setPlacement] = useState<'left' | 'right' | 'bottom'>('left');
      setPlacement = _setPlacement;
      return (
        <>
          <Stack.Toolbar placement={placement}>
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="content">Content</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: TestScreen,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Initial: left placement
    // [0] Layout render, [1] Screen with left toolbar
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.headerLeftBarButtonItems).toHaveLength(1);
    expect(MockedRouterToolbarHost).not.toHaveBeenCalled();

    // Change to right
    jest.clearAllMocks();
    act(() => setPlacement!('right'));

    // Composition cleanup clears left + right toolbar sets items
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerLeftBarButtonItems).toBeUndefined();
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerRightBarButtonItems).toHaveLength(
      1
    );
    expect(MockedRouterToolbarHost).not.toHaveBeenCalled();

    // Change to bottom
    jest.clearAllMocks();
    act(() => setPlacement!('bottom'));

    // Composition cleanup removes right items
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(
      ScreenStackItem.mock.calls[0][0].headerConfig?.headerRightBarButtonItems
    ).toBeUndefined();
    expect(MockedRouterToolbarHost).toHaveBeenCalledTimes(1);

    // RouterToolbarItem is called with correct icon for bottom placement
    expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
    expect(MockedRouterToolbarItem.mock.calls[0][0].systemImageName).toBe('star');

    // Change back to left
    jest.clearAllMocks();
    act(() => setPlacement!('left'));

    // [0] Left toolbar sets items (no cleanup needed from bottom)
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerLeftBarButtonItems).toHaveLength(1);
    expect(MockedRouterToolbarHost).not.toHaveBeenCalled();
  });
});

describe('Stack.Toolbar with navigation', () => {
  it('applies toolbar options after navigation', () => {
    function IndexScreen() {
      return <Text testID="index">Index</Text>;
    }

    function DetailScreen() {
      return (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="detail">Detail</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: IndexScreen,
      detail: DetailScreen,
    });

    expect(screen.getByTestId('index')).toBeVisible();

    jest.clearAllMocks();

    act(() => {
      router.push('/detail');
    });

    expect(screen.getByTestId('detail')).toBeVisible();

    // Render sequence after navigation:
    // Multiple renders occur during navigation; the last call should have toolbar options
    expect(ScreenStackItem.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Last call should have the toolbar options for the detail screen
    const lastCallIndex = ScreenStackItem.mock.calls.length - 1;
    const headerConfig = ScreenStackItem.mock.calls[lastCallIndex][0].headerConfig;
    expect(headerConfig?.headerRightBarButtonItems).toHaveLength(1);
    expect(
      (headerConfig!.headerRightBarButtonItems![0] as HeaderBarButtonItemWithAction).icon
    ).toEqual({ type: 'sfSymbol', name: 'star' });
  });

  it('updates toolbar placement after navigation', () => {
    let setPlacement: Dispatch<SetStateAction<'left' | 'right'>>;

    function IndexScreen() {
      return <Text testID="index">Index</Text>;
    }

    function DetailScreen() {
      const [placement, _setPlacement] = useState<'left' | 'right'>('left');
      setPlacement = _setPlacement;
      return (
        <>
          <Stack.Toolbar placement={placement}>
            <Stack.Toolbar.Button icon="star" onPress={() => {}} />
          </Stack.Toolbar>
          <Text testID="detail">Detail</Text>
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: IndexScreen,
      detail: DetailScreen,
    });

    expect(screen.getByTestId('index')).toBeVisible();

    act(() => {
      router.push('/detail');
    });

    expect(screen.getByTestId('detail')).toBeVisible();

    // After navigation, last call should have left toolbar items
    const lastCallBeforePlacementChange = ScreenStackItem.mock.calls.length - 1;
    expect(
      ScreenStackItem.mock.calls[lastCallBeforePlacementChange][0].headerConfig
        ?.headerLeftBarButtonItems
    ).toHaveLength(1);

    jest.clearAllMocks();

    act(() => setPlacement!('right'));

    // After placement change, two renders occur
    // [0] For index
    // [1] For detail with updated placement
    expect(ScreenStackItem.mock.calls.length).toBe(2);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('index');
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.title).toBe('detail');

    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.headerLeftBarButtonItems).toBeUndefined();
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.headerRightBarButtonItems).toHaveLength(
      1
    );
  });
});

it('updates multiple toolbars correctly when one changes placement', () => {
  let setRightToolbarPlacement: Dispatch<SetStateAction<'right' | 'bottom'>>;

  function TestScreen() {
    const [rightToolbarPlacement, _setRightToolbarPlacement] = useState<'right' | 'bottom'>(
      'right'
    );
    setRightToolbarPlacement = _setRightToolbarPlacement;
    return (
      <>
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button icon="sidebar.left" onPress={() => {}} />
        </Stack.Toolbar>
        <Stack.Toolbar placement={rightToolbarPlacement}>
          <Stack.Toolbar.Button icon="ellipsis.circle" onPress={() => {}} />
        </Stack.Toolbar>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();

  // Render sequence with two toolbars:
  // [0] Initial layout render
  // [1] toolbar sets options - left and right are batched by React Navigation
  expect(ScreenStackItem.mock.calls.length).toBe(2);

  expect(
    (
      ScreenStackItem.mock.calls[1][0].headerConfig
        ?.headerLeftBarButtonItems?.[0] as HeaderBarButtonItemWithAction
    ).icon
  ).toEqual({
    type: 'sfSymbol',
    name: 'sidebar.left',
  });
  expect(
    (
      ScreenStackItem.mock.calls[1][0].headerConfig!
        .headerRightBarButtonItems![0] as HeaderBarButtonItemWithAction
    ).icon
  ).toEqual({
    type: 'sfSymbol',
    name: 'ellipsis.circle',
  });

  jest.clearAllMocks();

  act(() => setRightToolbarPlacement!('bottom'));

  // RouterToolbarHost called for bottom toolbar
  expect(MockedRouterToolbarHost).toHaveBeenCalledTimes(1);

  // RouterToolbarItem is called with correct icon for the bottom toolbar
  expect(MockedRouterToolbarItem).toHaveBeenCalledTimes(1);
  expect(MockedRouterToolbarItem.mock.calls[0][0].systemImageName).toBe('ellipsis.circle');

  // Render sequence after changing right to bottom:
  // Composition cleanup removes right items (left toolbar stays)
  expect(ScreenStackItem.mock.calls.length).toBeGreaterThanOrEqual(1);

  // Right items cleared via composition cleanup, left items remain
  expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerRightBarButtonItems).toBeUndefined();
  expect(ScreenStackItem.mock.calls[0][0].headerConfig?.headerLeftBarButtonItems).toHaveLength(1);
  expect(
    (
      ScreenStackItem.mock.calls[0][0].headerConfig
        ?.headerLeftBarButtonItems?.[0] as HeaderBarButtonItemWithAction
    ).icon
  ).toEqual({
    type: 'sfSymbol',
    name: 'sidebar.left',
  });
});

it('batched placement changes: ends up in correct final state', () => {
  let setPlacement: Dispatch<SetStateAction<'left' | 'right' | 'bottom'>>;

  function TestScreen() {
    const [placement, _setPlacement] = useState<'left' | 'right' | 'bottom'>('left');
    setPlacement = _setPlacement;
    return (
      <>
        <Stack.Toolbar placement={placement}>
          <Stack.Toolbar.Button icon="star" onPress={() => {}} />
        </Stack.Toolbar>
        <Text testID="content">Content</Text>
      </>
    );
  }

  renderRouter({
    _layout: () => <Stack />,
    index: TestScreen,
  });

  expect(screen.getByTestId('content')).toBeVisible();

  jest.clearAllMocks();

  // Rapid changes within single act: left -> right -> bottom -> right
  // React batches these, so only the final state matters
  act(() => {
    setPlacement!('right');
    setPlacement!('bottom');
    setPlacement!('right');
  });

  // Final state should be right - verify last call has right items
  const lastCall = ScreenStackItem.mock.calls.length - 1;
  expect(lastCall).toBeGreaterThanOrEqual(0);
  expect(
    ScreenStackItem.mock.calls[lastCall][0].headerConfig!.headerRightBarButtonItems
  ).toHaveLength(1);
  expect(
    (
      ScreenStackItem.mock.calls[lastCall][0].headerConfig!
        .headerRightBarButtonItems![0] as HeaderBarButtonItemWithAction
    ).icon
  ).toEqual({ type: 'sfSymbol', name: 'star' });
});
