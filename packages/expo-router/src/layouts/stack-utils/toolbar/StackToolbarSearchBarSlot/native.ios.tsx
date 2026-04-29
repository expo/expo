'use client';
import { useId } from 'react';
import { Platform } from 'react-native';

import type { NativeToolbarSearchBarSlotProps } from './types';
import { RouterToolbarItem } from '../../../../toolbar/native';

/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
export const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps> = ({
  hidesSharedBackground,
  hidden,
  separateBackground,
}) => {
  const id = useId();
  if (process.env.EXPO_OS !== 'ios' || parseInt(String(Platform.Version).split('.')[0]!, 10) < 26) {
    return null;
  }
  if (hidden) {
    return null;
  }
  return (
    <RouterToolbarItem
      hidesSharedBackground={hidesSharedBackground}
      identifier={id}
      sharesBackground={!separateBackground}
      type="searchBar"
    />
  );
};
