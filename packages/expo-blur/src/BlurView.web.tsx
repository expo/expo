// Copyright © 2024 650 Industries.
'use client';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

import { BlurViewProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

const BlurView = forwardRef<{ setNativeProps: (props: BlurViewProps) => void }, BlurViewProps>(
  ({ tint = 'default', intensity = 50, style, ...props }, ref) => {
    const blurViewRef = useRef<HTMLDivElement>(null);
    const blurStyle = getBlurStyle({ tint, intensity });

    useImperativeHandle(
      ref,
      () => ({
        setNativeProps: (nativeProps: BlurViewProps) => {
          if (!blurViewRef.current?.style) {
            return;
          }

          // @ts-expect-error: `style.intensity` is not defined in the types
          const nextIntensity = nativeProps.style?.intensity ?? intensity;
          const blurStyle = getBlurStyle({ intensity: nextIntensity, tint: tint ?? 'default' });
          if (nativeProps.style) {
            for (const key in nativeProps.style) {
              if (key !== 'intensity') {
                blurViewRef.current.style[key] = nativeProps.style[key];
              }
            }
          }

          blurViewRef.current.style.backgroundColor = blurStyle.backgroundColor;
          blurViewRef.current.style.backdropFilter = blurStyle.backdropFilter;
          blurViewRef.current.style['webkitBackdropFilter'] = blurStyle.WebkitBackdropFilter;
        },
      }),
      [intensity, tint]
    );

    return (
      <View
        {...props}
        style={[style, blurStyle]}
        /** @ts-expect-error: mismatch in ref type to support manually setting style props. */
        ref={blurViewRef}
      />
    );
  }
);

function getBlurStyle({
  intensity,
  tint,
}: Required<Pick<BlurViewProps, 'intensity' | 'tint'>>): Record<string, string> {
  const blur = `saturate(180%) blur(${Math.min(intensity, 100) * 0.2}px)`;
  return {
    backgroundColor: getBackgroundColor(Math.min(intensity, 100), tint),
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
  };
}

export default BlurView;
