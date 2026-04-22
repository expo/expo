import { useMemo } from 'react';
import { BottomAccessoryPlacementContext } from '../hooks';
/**
 * Converts `<NativeTabs.BottomAccessory>` component into a function,
 * which can be used by `react-native-screens` to render the accessory.
 */
export function useBottomAccessoryFunctionFromBottomAccessories(bottomAccessory) {
    return useMemo(() => bottomAccessory
        ? (environment) => (<BottomAccessoryPlacementContext value={environment}>
              {bottomAccessory.props.children}
            </BottomAccessoryPlacementContext>)
        : undefined, [bottomAccessory]);
}
//# sourceMappingURL=bottomAccessory.js.map