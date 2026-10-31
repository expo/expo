'use client';
import { useId } from 'react';

import { RouterToolbarItem } from '../../../../toolbar/native';
import type { NativeToolbarViewProps } from './types';

/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
export const NativeToolbarView: React.FC<NativeToolbarViewProps> = ({
  children,
  hidden,
  hidesSharedBackground,
  separateBackground,
  tintColor,
  variant,
}) => {
  const id = useId();
  return (
    <RouterToolbarItem
      barButtonItemStyle={variant}
      hidesSharedBackground={hidesSharedBackground}
      hidden={hidden}
      identifier={id}
      sharesBackground={!separateBackground}
      tintColor={tintColor}>
      {children}
    </RouterToolbarItem>
  );
};
