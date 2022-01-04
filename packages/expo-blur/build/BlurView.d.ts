import React from 'react';
import { View, ViewProps } from 'react-native';
/**
 * @skip
 * This `forwardedRef` mechanism is necessary to make this component work properly
 * with React's `ref` prop and to react to props updates as expected.
 */
declare const BlurViewWithForwardedRef: React.ForwardRefExoticComponent<{
    tint?: import("./BlurView.types").BlurTint | undefined;
    intensity?: number | undefined;
} & ViewProps & React.RefAttributes<View>>;
export default BlurViewWithForwardedRef;
//# sourceMappingURL=BlurView.d.ts.map