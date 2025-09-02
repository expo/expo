// Copyright © 2024 650 Industries.

'use client';

import { requireNativeViewManager } from 'expo-modules-core';

import { GlassViewProps } from './GlassView.types';

const NativeGlassView = requireNativeViewManager<GlassViewProps>('ExpoBlurView', 'GlassView');

export default NativeGlassView;
