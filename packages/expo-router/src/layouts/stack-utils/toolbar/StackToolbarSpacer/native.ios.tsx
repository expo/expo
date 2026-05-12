'use client';
import { useId } from 'react';

import type { NativeToolbarSpacerProps } from './types';
import { RouterToolbarItem } from '../../../../toolbar/native';

/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
export const NativeToolbarSpacer: React.FC<NativeToolbarSpacerProps> = (props) => {
  const id = useId();
  return (
    <RouterToolbarItem
      hidesSharedBackground={props.hidesSharedBackground}
      hidden={props.hidden}
      identifier={id}
      sharesBackground={props.sharesBackground}
      type={props.width ? 'fixedSpacer' : 'fluidSpacer'}
      width={props.width}
    />
  );
};
