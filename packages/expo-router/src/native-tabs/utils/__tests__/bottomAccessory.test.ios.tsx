import { render, renderHook } from '@testing-library/react-native';
import { isValidElement } from 'react';
import { View } from 'react-native';

import { NativeTabs } from '../../NativeTabs';
import { NativeTabsBottomAccessory } from '../../common/elements';
import { BottomAccessoryPlacementContext } from '../../hooks';
import { useBottomAccessoryFunctionFromBottomAccessories } from '../bottomAccessory';

describe('useBottomAccessoryFunctionFromBottomAccessories', () => {
  it('returns undefined when given undefined', () => {
    const { result } = renderHook(() => useBottomAccessoryFunctionFromBottomAccessories(undefined));

    expect(result.current).toBeUndefined();
  });

  it('returns a function that wraps the accessory children in BottomAccessoryPlacementContext with correct value', () => {
    function TestContent() {
      const value = NativeTabs.BottomAccessory.usePlacement();
      return <View testID={`test-accessory-${value}`}>{value}</View>;
    }
    const accessory = (
      <NativeTabsBottomAccessory>
        <TestContent />
      </NativeTabsBottomAccessory>
    );

    const { result } = renderHook(() => useBottomAccessoryFunctionFromBottomAccessories(accessory));

    expect(result.current).toBeDefined();
    const bottomAccessoryFn = result.current!;

    const regularResult = bottomAccessoryFn('regular');
    const inlineResult = bottomAccessoryFn('inline');

    expect(regularResult).toBeDefined();
    expect(isValidElement(regularResult)).toBe(true);
    // To satisfy TypeScript
    if (!isValidElement(regularResult)) throw new Error();
    expect(regularResult.type).toBe(BottomAccessoryPlacementContext);
    if (regularResult.type !== BottomAccessoryPlacementContext) throw new Error();

    expect(inlineResult).toBeDefined();
    expect(isValidElement(inlineResult)).toBe(true);
    // To satisfy TypeScript
    if (!isValidElement(inlineResult)) throw new Error();
    expect(inlineResult.type).toBe(BottomAccessoryPlacementContext);
    if (inlineResult.type !== BottomAccessoryPlacementContext) throw new Error();

    const { getByTestId: getByTestIdRegular } = render(regularResult);
    const { getByTestId: getByTestIdInline } = render(inlineResult);

    expect(getByTestIdRegular('test-accessory-regular')).toBeDefined();
    expect(getByTestIdInline('test-accessory-inline')).toBeDefined();
  });

  // Test memoization
  it('memoizes the result and only recalculates when accessory changes', () => {
    const firstContent = <View>First</View>;
    const accessory = <NativeTabsBottomAccessory>{firstContent}</NativeTabsBottomAccessory>;

    const { result, rerender } = renderHook(
      ({ acc }) => useBottomAccessoryFunctionFromBottomAccessories(acc),
      { initialProps: { acc: accessory } }
    );

    const firstResult = result.current;

    // Rerender with same accessory
    rerender({ acc: accessory });
    expect(result.current).toBe(firstResult);

    // Rerender with different accessory
    const newAccessory = (
      <NativeTabsBottomAccessory>
        <View>New</View>
      </NativeTabsBottomAccessory>
    );
    rerender({ acc: newAccessory });
    expect(result.current).not.toBe(firstResult);

    // Rerender with undefined
    rerender({ acc: undefined });
    expect(result.current).toBeUndefined();
  });
});
