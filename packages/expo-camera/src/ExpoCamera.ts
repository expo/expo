import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';

import type { CameraNativeProps } from './Camera.types';

const ExpoCamera: ComponentType<CameraNativeProps> = requireNativeView('ExpoCamera');

export default ExpoCamera;
