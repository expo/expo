// Copyright © 2024 650 Industries.

'use client';

import { requireNativeViewManager } from 'expo-modules-core';

import type { GlassViewProps } from './GlassView.types';

const NativeGlassView = requireNativeViewManager<GlassViewProps>('ExpoGlassEffect', 'GlassView');

const GlassView = (props: GlassViewProps) => {
  return <NativeGlassView {...props} />;
};

export default GlassView;
