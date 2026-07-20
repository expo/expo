import { StrictMode, useLayoutEffect } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { addColorPaletteListener, Material3DynamicColor } from '../materialColor';
import { ColorProvider, useColor } from '../ColorContext';
import { renderHook, renderRouter } from '../../testing-library';

let mockColorScheme: 'light' | 'dark' = 'light';

jest.mock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native') as typeof import('react-native');
  return Object.setPrototypeOf({ useColorScheme: () => mockColorScheme }, actualReactNative);
});

jest.mock('../materialColor', () => {
  const originalModule = jest.requireActual(
    '../materialColor'
  ) as typeof import('../materialColor');
  return {
    ...originalModule,
    Material3DynamicColor: jest.fn(),
    addColorPaletteListener: jest.fn(),
  };
});

const mockedDynamicColor = Material3DynamicColor as jest.Mock;
const mockedAddListener = addColorPaletteListener as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockColorScheme = 'light';
  mockedDynamicColor.mockImplementation((name: string) => '#' + name);
  mockedAddListener.mockImplementation(() => jest.fn());
});

function getCapturedListener(): () => void {
  expect(mockedAddListener).toHaveBeenCalledTimes(1);
  return mockedAddListener.mock.calls[0][0];
}

it('exposes the Color API resolving dynamic colors at read time', () => {
  const { result } = renderHook(() => useColor(), { wrapper: ColorProvider });
  expect(result.current.android.dynamic.primary).toBe('#primary');
  expect(mockedDynamicColor).toHaveBeenCalledWith('primary');
});

it('keeps a stable identity across re-renders', () => {
  const { result, rerender } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const first = result.current;
  rerender({});
  expect(result.current).toBe(first);
});

it('keeps stable nested identities across re-renders', () => {
  const { result, rerender } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const android = result.current.android;
  const dynamic = result.current.android.dynamic;
  rerender({});
  expect(result.current.android).toBe(android);
  expect(result.current.android.dynamic).toBe(dynamic);
  expect(result.current.android.dynamic).toBe(result.current.android.dynamic);
});

it('returns new nested objects when the native palette change event fires', () => {
  const { result } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const android = result.current.android;
  const dynamic = result.current.android.dynamic;
  const listener = getCapturedListener();

  act(() => listener());

  expect(result.current.android).not.toBe(android);
  expect(result.current.android.dynamic).not.toBe(dynamic);
});

it('returns a new object when the native palette change event fires', () => {
  const { result } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const first = result.current;
  const listener = getCapturedListener();

  mockedDynamicColor.mockImplementation((name: string) => '#changed-' + name);
  act(() => listener());

  expect(result.current).not.toBe(first);
  expect(result.current.android.dynamic.primary).toBe('#changed-primary');
});

it('updates colors in an effect when the color scheme changes', () => {
  const committedColors: object[] = [];
  function Consumer() {
    const color = useColor();
    useLayoutEffect(() => {
      committedColors.push(color);
    });
    return null;
  }

  const { rerender } = render(
    <ColorProvider>
      <Consumer />
    </ColorProvider>
  );
  const first = committedColors.at(-1);
  committedColors.length = 0;

  mockColorScheme = 'dark';
  rerender(
    <ColorProvider>
      <Consumer />
    </ColorProvider>
  );

  expect(committedColors.length).toBe(2);
  expect(committedColors[0]).toBe(first);
  expect(committedColors[1]).not.toBe(first);
});

it('keeps a single identity on mount', () => {
  const committedColors: object[] = [];
  function Consumer() {
    const color = useColor();
    useLayoutEffect(() => {
      committedColors.push(color);
    });
    return null;
  }

  render(
    <ColorProvider>
      <Consumer />
    </ColorProvider>
  );

  expect(committedColors.length).toBe(1);
});

it('keeps a single identity on mount in StrictMode', () => {
  const committedColors: object[] = [];
  function Consumer() {
    const color = useColor();
    useLayoutEffect(() => {
      committedColors.push(color);
    });
    return null;
  }

  render(
    <StrictMode>
      <ColorProvider>
        <Consumer />
      </ColorProvider>
    </StrictMode>
  );

  // StrictMode re-runs effects via a simulated remount, but the color identity must not change.
  expect(new Set(committedColors).size).toBe(1);
});

it('shares one native listener between consumers and updates both together', () => {
  const colors: { first?: object; second?: object } = {};
  function First() {
    colors.first = useColor();
    return null;
  }
  function Second() {
    colors.second = useColor();
    return null;
  }

  render(
    <ColorProvider>
      <First />
      <Second />
    </ColorProvider>
  );

  const listener = getCapturedListener();
  expect(colors.first).toBe(colors.second);

  const before = colors.first;
  act(() => listener());

  expect(colors.first).not.toBe(before);
  expect(colors.first).toBe(colors.second);
});

it('removes the native listener on unmount', () => {
  const { unmount } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const cleanup = mockedAddListener.mock.results[0]!.value;
  unmount();
  expect(cleanup).toHaveBeenCalled();
});

it('re-renders a component with new colors after a palette change', () => {
  function Colored() {
    const color = useColor();
    return <Text testID="color">{String(color.android.dynamic.primary)}</Text>;
  }
  render(
    <ColorProvider>
      <Colored />
    </ColorProvider>
  );
  expect(screen.getByTestId('color')).toHaveTextContent('#primary');

  const listener = getCapturedListener();
  mockedDynamicColor.mockImplementation((name: string) => '#new-' + name);
  act(() => listener());

  expect(screen.getByTestId('color')).toHaveTextContent('#new-primary');
});

it('throws a helpful error when used outside the router', () => {
  expect(() => renderHook(() => useColor())).toThrow(
    /useColor.*expo-router/
  );
});

it('is provided automatically by ExpoRoot', () => {
  function Colored() {
    const color = useColor();
    return <Text testID="color">{String(color.android.dynamic.primary)}</Text>;
  }
  renderRouter({ index: Colored });
  expect(screen.getByTestId('color')).toHaveTextContent('#primary');
});
