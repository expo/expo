'use client';

import { requireNativeViewManager } from 'expo';
import * as React from 'react';

import { NativeLinearGradientProps } from './NativeLinearGradient.types';

const NativeLinearGradient = requireNativeViewManager(
  'ExpoLinearGradient'
) as React.FC<NativeLinearGradientProps>;

export default NativeLinearGradient;
