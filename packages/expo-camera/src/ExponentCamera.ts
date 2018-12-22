import { requireNativeViewManager } from 'expo-core';
import * as React from 'react';
import { NativePropsType } from './Camera.types';

const ExponentCamera: React.ComponentType<NativePropsType> = requireNativeViewManager(
  'ExponentCamera'
);

export default ExponentCamera;
