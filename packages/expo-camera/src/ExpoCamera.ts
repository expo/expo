import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { CameraNativeProps } from './Camera.types';

const ExponentCamera: React.ComponentType<CameraNativeProps> =
  requireNativeViewManager('ExpoCamera');

export default ExponentCamera;
