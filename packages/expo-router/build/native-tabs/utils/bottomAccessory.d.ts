import { type ReactElement } from 'react';
import type { BottomAccessoryFn } from 'react-native-screens';
import type { NativeTabsBottomAccessoryProps } from '../common/elements';
/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
export declare function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory: ReactElement<NativeTabsBottomAccessoryProps, string | React.JSXElementConstructor<any>> | undefined): BottomAccessoryFn | undefined;
//# sourceMappingURL=bottomAccessory.d.ts.map