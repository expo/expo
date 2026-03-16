'use client';
import type { NativeToolbarMenuProps } from './types';

/**
 * Toolbar menus are not supported on Android.
 */
export const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = () => null;

/**
 * Toolbar menu actions are not supported on Android.
 */
export const NativeToolbarMenuAction = (_props: unknown) => null;
