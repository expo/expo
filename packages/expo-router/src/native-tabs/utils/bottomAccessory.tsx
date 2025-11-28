import { useMemo, type ReactElement } from 'react';
import type { BottomAccessoryFn } from 'react-native-screens';

import type { NativeTabsBottomAccessoryProps } from '../common/elements';
import { BottomAccessoryEnvironmentContext } from '../hooks';

/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
export function useBottomAccessoryFunctionFromBottomAccessories(
  bottomAccessory:
    | ReactElement<NativeTabsBottomAccessoryProps, string | React.JSXElementConstructor<any>>
    | undefined
): BottomAccessoryFn | undefined {
  return useMemo<BottomAccessoryFn | undefined>(
    () =>
      bottomAccessory
        ? (environment) => (
            <BottomAccessoryEnvironmentContext value={environment}>
              {bottomAccessory.props.children}
            </BottomAccessoryEnvironmentContext>
          )
        : undefined,
    [bottomAccessory]
  );
}
