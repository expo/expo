import { useMemo, type ReactElement } from 'react';
import type { TabAccessoryComponentFactory } from 'react-native-screens';

import type { NativeTabsBottomAccessoryProps } from '../common/elements';
import { BottomAccessoryPlacementContext } from '../hooks';

/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
export function useBottomAccessoryFunctionFromBottomAccessories(
  bottomAccessory:
    | ReactElement<NativeTabsBottomAccessoryProps, string | React.JSXElementConstructor<any>>
    | undefined
): TabAccessoryComponentFactory | undefined {
  return useMemo<TabAccessoryComponentFactory | undefined>(
    () =>
      bottomAccessory
        ? (environment) => (
            <BottomAccessoryPlacementContext value={environment}>
              {bottomAccessory.props.children}
            </BottomAccessoryPlacementContext>
          )
        : undefined,
    [bottomAccessory]
  );
}
