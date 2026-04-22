'use client';

import { requireNativeViewManager } from 'expo-modules-core';
import type * as React from 'react';

import type { NativeLinearGradientProps } from './NativeLinearGradient.types';

const NativeLinearGradient = requireNativeViewManager(
  'ExpoLinearGradient'
) as React.FC<NativeLinearGradientProps>;

export default NativeLinearGradient;
