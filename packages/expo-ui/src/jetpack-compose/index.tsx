import { requireNativeModule } from 'expo';

import { ExpoModifier } from '../types';

export * from './AlertDialog';
export * from './Button';
export * from './ContextMenu';
export * from './DatePicker';
export * from './Picker';
export * from './Progress';
export * from './Slider';
export * from './Switch';
export * from './TextInput';
export * from './Shape';

const nativeExpoUIModule = requireNativeModule('ExpoUI');

export const padding: (all: number) => ExpoModifier = nativeExpoUIModule.padding;
export const size: (width: number, height: number) => ExpoModifier = nativeExpoUIModule.size;
export const fillMaxSize: () => ExpoModifier = nativeExpoUIModule.fillMaxSize;
export const offset: (x: number, y: number) => ExpoModifier = nativeExpoUIModule.offset;
export const background: (color: string) => ExpoModifier = nativeExpoUIModule.background;
export const border: (borderWidth: number, borderColor: string) => ExpoModifier =
  nativeExpoUIModule.border;
export const shadow: (elevation: number) => ExpoModifier = nativeExpoUIModule.shadow;
export const alpha: (alpha: number) => ExpoModifier = nativeExpoUIModule.alpha;
export const blur: (radius: number) => ExpoModifier = nativeExpoUIModule.blur;
export const clickable: (callback: () => void) => ExpoModifier = nativeExpoUIModule.clickable;
export const rotate: (degrees: number) => ExpoModifier = nativeExpoUIModule.rotate;
export const zIndex: (index: number) => ExpoModifier = nativeExpoUIModule.zIndex;
