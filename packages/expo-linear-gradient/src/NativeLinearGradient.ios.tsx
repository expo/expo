'use client';

import { requireNativeView } from 'expo';
import type * as React from 'react';

import type { NativeLinearGradientProps } from './NativeLinearGradient.types';

const NativeLinearGradient = requireNativeView(
  'ExpoLinearGradient'
) as React.FC<NativeLinearGradientProps>;

export default NativeLinearGradient;
