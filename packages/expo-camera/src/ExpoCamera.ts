import { requireNativeViewManager } from 'expo';
import { type ComponentType } from 'react';

import { CameraNativeProps } from './Camera.types';

const ExpoCamera: ComponentType<CameraNativeProps> = requireNativeViewManager('ExpoCamera');

export default ExpoCamera;
