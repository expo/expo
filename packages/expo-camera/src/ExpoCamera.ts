import { requireNativeViewManager } from 'expo-modules-core';
import type { ComponentType } from 'react';

import type { CameraNativeProps } from './Camera.types';

const ExpoCamera: ComponentType<CameraNativeProps> = requireNativeViewManager('ExpoCamera');

export default ExpoCamera;
