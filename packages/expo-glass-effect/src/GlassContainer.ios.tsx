// Copyright © 2024 650 Industries.

'use client';

import { requireNativeView } from 'expo';

import type { GlassContainerProps } from './GlassContainer.types';

const NativeGlassContainer = requireNativeView<GlassContainerProps>(
  'ExpoGlassEffect',
  'GlassContainer'
);

export default NativeGlassContainer;
