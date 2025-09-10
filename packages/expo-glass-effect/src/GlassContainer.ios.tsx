// Copyright © 2024 650 Industries.

'use client';

import { requireNativeViewManager } from 'expo-modules-core';

import { GlassContainerProps } from './GlassContainer.types';

const NativeGlassContainer = requireNativeViewManager<GlassContainerProps>(
  'ExpoGlassEffect',
  'GlassContainer'
);

export default NativeGlassContainer;
