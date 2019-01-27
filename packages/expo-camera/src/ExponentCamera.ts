import { requireNativeViewManager } from 'expo-core';
import * as React from 'react';
import { NativeProps } from './Camera.types';

const ExponentCamera: React.ComponentType<NativeProps> = requireNativeViewManager('ExponentCamera');

export default ExponentCamera;
