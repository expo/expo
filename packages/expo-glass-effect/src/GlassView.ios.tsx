// Copyright © 2024 650 Industries.

'use client';

import { requireNativeViewManager } from 'expo-modules-core';

import { GlassViewProps, GlassEffectStyleConfig } from './GlassView.types';

const NativeGlassView = requireNativeViewManager<
  Omit<GlassViewProps, 'glassEffectStyle'> & { glassEffectStyle: GlassEffectStyleConfig }
>('ExpoGlassEffect', 'GlassView');

function normalizeGlassEffectStyle(
  style: GlassViewProps['glassEffectStyle']
): GlassEffectStyleConfig {
  if (typeof style === 'string') {
    return { style, animate: false };
  }
  return style ?? { style: 'regular', animate: false };
}

const GlassView = ({ glassEffectStyle, ...props }: GlassViewProps) => {
  const normalizedStyle = normalizeGlassEffectStyle(glassEffectStyle);
  return <NativeGlassView glassEffectStyle={normalizedStyle} {...props} />;
};

export default GlassView;
