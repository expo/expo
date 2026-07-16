import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { addColorPaletteListener, Material3DynamicColor } from '../materialColor';
import { useRouterColor } from '../useRouterColor';
import { renderHook } from '../../testing-library';

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
  const { result } = renderHook(() => useRouterColor());
  expect(result.current.android.dynamic.primary).toBe('#primary');
  expect(mockedDynamicColor).toHaveBeenCalledWith('primary');
});

it('keeps a stable identity across re-renders', () => {
  const { result, rerender } = renderHook(() => useRouterColor());
  const first = result.current;
  rerender({});
  expect(result.current).toBe(first);
});

it('keeps stable nested identities across re-renders', () => {
  const { result, rerender } = renderHook(() => useRouterColor());
  const android = result.current.android;
  const dynamic = result.current.android.dynamic;
  rerender({});
  expect(result.current.android).toBe(android);
  expect(result.current.android.dynamic).toBe(dynamic);
  // Repeated reads of the same object return the same nested references.
  expect(result.current.android.dynamic).toBe(result.current.android.dynamic);
});

it('returns new nested objects when the native palette change event fires', () => {
  const { result } = renderHook(() => useRouterColor());
  const android = result.current.android;
  const dynamic = result.current.android.dynamic;
  const listener = getCapturedListener();

  act(() => listener());

  expect(result.current.android).not.toBe(android);
  expect(result.current.android.dynamic).not.toBe(dynamic);
});

it('returns a new object when the native palette change event fires', () => {
  const { result } = renderHook(() => useRouterColor());
  const first = result.current;
  const listener = getCapturedListener();

  mockedDynamicColor.mockImplementation((name: string) => '#changed-' + name);
  act(() => listener());

  expect(result.current).not.toBe(first);
  expect(result.current.android.dynamic.primary).toBe('#changed-primary');
});

it('returns a new object when the color scheme changes', () => {
  const { result, rerender } = renderHook(() => useRouterColor());
  const first = result.current;

  mockColorScheme = 'dark';
  rerender({});

  expect(result.current).not.toBe(first);
});

it('removes the native listener on unmount', () => {
  const { unmount } = renderHook(() => useRouterColor());
  const cleanup = mockedAddListener.mock.results[0]!.value;
  unmount();
  expect(cleanup).toHaveBeenCalled();
});

it('re-renders a component with new colors after a palette change', () => {
  function Colored() {
    const color = useRouterColor();
    return <Text testID="color">{String(color.android.dynamic.primary)}</Text>;
  }
  render(<Colored />);
  expect(screen.getByTestId('color')).toHaveTextContent('#primary');

  const listener = getCapturedListener();
  mockedDynamicColor.mockImplementation((name: string) => '#new-' + name);
  act(() => listener());

  expect(screen.getByTestId('color')).toHaveTextContent('#new-primary');
});
