import { PlatformColor, Text } from 'react-native';

import { ColorProvider, useColor } from '../ColorContext';
import { renderHook, renderRouter, screen } from '../../testing-library';

it('returns null android colors and iOS platform colors on iOS', () => {
  const { result } = renderHook(() => useColor(), { wrapper: ColorProvider });
  expect(result.current.android.dynamic.primary).toBeNull();
  expect(result.current.ios.label).toStrictEqual(PlatformColor('label'));
});

it('keeps a stable identity across re-renders on iOS', () => {
  const { result, rerender } = renderHook(() => useColor(), { wrapper: ColorProvider });
  const first = result.current;
  rerender({});
  expect(result.current).toBe(first);
});

it('throws a helpful error when used outside the router', () => {
  expect(() => renderHook(() => useColor())).toThrow(/useColor.*expo-router/);
});

it('is provided automatically by ExpoRoot', () => {
  function Colored() {
    const color = useColor();
    return <Text testID="color">{color.ios.label ? 'has-label' : 'no-label'}</Text>;
  }
  renderRouter({ index: Colored });
  expect(screen.getByTestId('color')).toHaveTextContent('has-label');
});
