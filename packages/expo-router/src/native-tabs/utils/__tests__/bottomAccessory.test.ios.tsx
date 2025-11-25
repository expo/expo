import { renderHook } from '@testing-library/react-native';
import { View } from 'react-native';

import { NativeTabsBottomAccessory } from '../../common/elements';
import { useBottomAccessoryFunctionFromBottomAccessories } from '../bottomAccessory';

describe('useBottomAccessoryFunctionFromBottomAccessories', () => {
  it('returns undefined when given an empty array', () => {
    const { result } = renderHook(() => useBottomAccessoryFunctionFromBottomAccessories([]));

    expect(result.current).toBeUndefined();
  });

  it('returns a function that uses the single accessory for both states when forState is not specified', () => {
    const testContent = <View>Test Accessory</View>;
    const accessories = [<NativeTabsBottomAccessory>{testContent}</NativeTabsBottomAccessory>];

    const { result } = renderHook(() =>
      useBottomAccessoryFunctionFromBottomAccessories(accessories)
    );

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    // Should return the same content for both states
    expect(bottomAccessoryFn('regular')).toBe(testContent);
    expect(bottomAccessoryFn('inline')).toBe(testContent);
  });

  it.each(['regular', 'inline'] as const)(
    'returns a function that uses the single accessory for both states even when forState is specified as %s',
    (state) => {
      const regularContent = <View>Regular Accessory</View>;
      const accessories = [
        <NativeTabsBottomAccessory forState={state}>{regularContent}</NativeTabsBottomAccessory>,
      ];

      const { result } = renderHook(() =>
        useBottomAccessoryFunctionFromBottomAccessories(accessories)
      );

      expect(result.current).toBeDefined();
      const bottomAccessoryFn = result.current!;

      // Should return the same content for both states since there's only one accessory
      expect(bottomAccessoryFn('regular')).toBe(regularContent);
      expect(bottomAccessoryFn('inline')).toBe(regularContent);
    }
  );

  it('uses the first accessory for both states when forState is not specified on either', () => {
    const firstContent = <View>First Accessory</View>;
    const secondContent = <View>Second Accessory</View>;
    const accessories = [
      <NativeTabsBottomAccessory>{firstContent}</NativeTabsBottomAccessory>,
      <NativeTabsBottomAccessory>{secondContent}</NativeTabsBottomAccessory>,
    ];

    const { result } = renderHook(() =>
      useBottomAccessoryFunctionFromBottomAccessories(accessories)
    );

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    // Should use the first accessory for both states
    expect(bottomAccessoryFn('regular')).toBe(firstContent);
    expect(bottomAccessoryFn('inline')).toBe(firstContent);
  });

  it('returns appropriate accessory based on forState when two accessories have different states', () => {
    const regularContent = <View>Regular Accessory</View>;
    const inlineContent = <View>Inline Accessory</View>;
    const accessories = [
      <NativeTabsBottomAccessory forState="regular">{regularContent}</NativeTabsBottomAccessory>,
      <NativeTabsBottomAccessory forState="inline">{inlineContent}</NativeTabsBottomAccessory>,
    ];

    const { result } = renderHook(() =>
      useBottomAccessoryFunctionFromBottomAccessories(accessories)
    );

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    // Should return the correct accessory for each state
    expect(bottomAccessoryFn('regular')).toBe(regularContent);
    expect(bottomAccessoryFn('inline')).toBe(inlineContent);
  });

  it('uses the first matching accessory when multiple accessories have the same forState', () => {
    const firstRegularContent = <View>First Regular</View>;
    const secondRegularContent = <View>Second Regular</View>;
    const accessories = [
      <NativeTabsBottomAccessory forState="regular">
        {firstRegularContent}
      </NativeTabsBottomAccessory>,
      <NativeTabsBottomAccessory forState="regular">
        {secondRegularContent}
      </NativeTabsBottomAccessory>,
    ];

    const { result } = renderHook(() =>
      useBottomAccessoryFunctionFromBottomAccessories(accessories)
    );

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    // Should use the first matching accessory for both states
    expect(bottomAccessoryFn('regular')).toBe(firstRegularContent);
    expect(bottomAccessoryFn('inline')).toBe(firstRegularContent);
  });

  it('falls back to first accessory when specific state is not found', () => {
    const firstContent = <View>First (no state)</View>;
    const regularContent = <View>Regular Accessory</View>;
    const accessories = [
      <NativeTabsBottomAccessory>{firstContent}</NativeTabsBottomAccessory>,
      <NativeTabsBottomAccessory forState="regular">{regularContent}</NativeTabsBottomAccessory>,
    ];

    const { result } = renderHook(() =>
      useBottomAccessoryFunctionFromBottomAccessories(accessories)
    );

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    // Regular state should find the specific one
    expect(bottomAccessoryFn('regular')).toBe(regularContent);
    // Inline state should fall back to first
    expect(bottomAccessoryFn('inline')).toBe(firstContent);
  });

  // Test memoization
  it('memoizes the result and only recalculates when accessories change', () => {
    const firstContent = <View>First</View>;
    const accessories = [<NativeTabsBottomAccessory>{firstContent}</NativeTabsBottomAccessory>];

    const { result, rerender } = renderHook(
      ({ acc }) => useBottomAccessoryFunctionFromBottomAccessories(acc),
      { initialProps: { acc: accessories } }
    );

    const firstResult = result.current;

    // Rerender with same accessories
    rerender({ acc: accessories });
    expect(result.current).toBe(firstResult);

    // Rerender with different accessories
    const newAccessories = [
      <NativeTabsBottomAccessory>
        <View>New</View>
      </NativeTabsBottomAccessory>,
    ];
    rerender({ acc: newAccessories });
    expect(result.current).not.toBe(firstResult);
  });
});
