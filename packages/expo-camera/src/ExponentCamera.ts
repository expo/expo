import { requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';

import { CameraNativeProps } from './Camera.types';

const ExponentCamera: React.ComponentType<CameraNativeProps> = requireNativeViewManager(
  'ExponentCamera'
);

export default ExponentCamera;
