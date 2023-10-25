import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { CameraNativeProps } from './Camera.types';

const ExpoCamera: React.ComponentType<CameraNativeProps> =
  requireNativeViewManager('ExpoCameraNext');

export default ExpoCamera;
