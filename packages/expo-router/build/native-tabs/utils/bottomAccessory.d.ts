import { type ReactElement } from 'react';
import type { BottomAccessoryFn } from 'react-native-screens';
import type { NativeTabsBottomAccessoryProps } from '../common/elements';
/**
 * Converts an array of `<NativeTabs.BottomAccessory>` components into a function,
 * which can be used by `react-native-screens` to render the accessory
 */
export declare function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessories: ReactElement<NativeTabsBottomAccessoryProps, string | React.JSXElementConstructor<any>>[]): BottomAccessoryFn | undefined;
//# sourceMappingURL=bottomAccessory.d.ts.map