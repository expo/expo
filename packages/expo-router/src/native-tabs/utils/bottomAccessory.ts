import { useMemo, type ReactElement } from 'react';
import type { BottomAccessoryFn } from 'react-native-screens';

import type { NativeTabsBottomAccessoryProps } from '../common/elements';

/**
 * Converts an array of `<NativeTabs.BottomAccessory>` components into a function,
 * which can be used by `react-native-screens` to render the accessory
 */
export function useBottomAccessoryFunctionFromBottomAccessories(
  bottomAccessories: ReactElement<
    NativeTabsBottomAccessoryProps,
    string | React.JSXElementConstructor<any>
  >[]
): BottomAccessoryFn | undefined {
  const regularAccessory = useMemo(
    () =>
      bottomAccessories.find((accessory) => accessory.props.forState === 'regular') ??
      bottomAccessories[0],
    [bottomAccessories]
  );
  const inlineAccessory = useMemo(
    () =>
      bottomAccessories.find((accessory) => accessory.props.forState === 'inline') ??
      bottomAccessories[0],
    [bottomAccessories]
  );
  return useMemo<BottomAccessoryFn | undefined>(
    () =>
      bottomAccessories.length > 0
        ? (environment) => {
            if (environment === 'inline') {
              return inlineAccessory.props.children;
            }
            return regularAccessory.props.children;
          }
        : undefined,
    [regularAccessory, inlineAccessory]
  );
}
