// Copyright © 2024 650 Industries.

'use client';

import { requireNativeViewManager } from 'expo-modules-core';

import { GlassViewProps } from './GlassView.types';

const NativeGlassView = requireNativeViewManager<GlassViewProps>('ExpoGlassEffect', 'GlassView');

export default NativeGlassView;
