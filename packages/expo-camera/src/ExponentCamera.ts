import { requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';

import { CamerNativeProps } from './Camera.types';

const ExponentCamera: React.ComponentType<CamerNativeProps> = requireNativeViewManager(
  'ExponentCamera'
);

export default ExponentCamera;
