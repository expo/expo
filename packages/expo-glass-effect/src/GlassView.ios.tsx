// Copyright © 2024 650 Industries.

'use client';

import { requireNativeView } from 'expo';

import type { GlassViewProps } from './GlassView.types';

const NativeGlassView = requireNativeView<GlassViewProps>('ExpoGlassEffect', 'GlassView');

const GlassView = (props: GlassViewProps) => {
  return <NativeGlassView {...props} />;
};

export default GlassView;
