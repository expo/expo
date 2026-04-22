'use client';
import * as React from 'react';
export const AnimatedHeaderHeightContext = React.createContext(undefined);
export function useAnimatedHeaderHeight() {
    const animatedValue = React.useContext(AnimatedHeaderHeightContext);
    if (animatedValue === undefined) {
        throw new Error("Couldn't find the header height. Are you inside a screen in a native stack navigator?");
    }
    return animatedValue;
}
//# sourceMappingURL=useAnimatedHeaderHeight.js.map