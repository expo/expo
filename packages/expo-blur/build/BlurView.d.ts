import React from 'react';
import { View } from 'react-native';
declare const BlurViewWithForwardedRef: React.ForwardRefExoticComponent<{
    tint?: import("./BlurView.types").BlurTint | undefined;
    intensity?: number | undefined;
    forwardedRef?: React.ForwardedRef<View> | undefined;
} & import("react-native").ViewProps & React.RefAttributes<View>>;
export default BlurViewWithForwardedRef;
