'use client';
import type { NativeToolbarSearchBarSlotProps } from './types';

/**
 * Toolbar search bar slot is not supported on Android.
 */
export const NativeToolbarSearchBarSlot: React.FC<NativeToolbarSearchBarSlotProps> = () => null;
