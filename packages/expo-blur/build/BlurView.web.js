// Copyright © 2024 650 Industries.
'use client';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
const BlurView = forwardRef(({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    const blurViewRef = useRef(null);
    const blurStyle = getBlurStyle({ tint, intensity });
    useImperativeHandle(ref, () => ({
        setNativeProps: (nativeProps) => {
            if (!blurViewRef.current?.style) {
                return;
            }
            // @ts-expect-error: `style.intensity` is not defined in the types
            const nextIntensity = nativeProps.style?.intensity ?? intensity;
            const blurStyle = getBlurStyle({ intensity: nextIntensity, tint: tint ?? 'default' });
            if (nativeProps.style) {
                for (const key in nativeProps.style) {
                    if (key !== 'intensity') {
                        blurViewRef.current.style[key] =
                            nativeProps.style[key];
                    }
                }
            }
            blurViewRef.current.style.backgroundColor = blurStyle.backgroundColor;
            blurViewRef.current.style.backdropFilter = blurStyle.backdropFilter;
            // @ts-expect-error: Webkit-specific legacy property (let's not type this, since it's deprecated)
            blurViewRef.current.style['webkitBackdropFilter'] = blurStyle.WebkitBackdropFilter;
        },
    }), [intensity, tint]);
    return (<View {...props} style={[style, blurStyle]} 
    /** @ts-expect-error: mismatch in ref type to support manually setting style props. */
    ref={blurViewRef}/>);
});
function getBlurStyle({ intensity, tint, }) {
    const blur = `saturate(180%) blur(${Math.min(intensity, 100) * 0.2}px)`;
    return {
        backgroundColor: getBackgroundColor(Math.min(intensity, 100), tint),
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
    };
}
export default BlurView;
//# sourceMappingURL=BlurView.web.js.map