import { requireNativeViewManager } from 'expo';
import { NativeModulesProxy } from 'expo/internal';
import * as React from 'react';

import { NativeExpoGoogleMapsViewProps, NativeExpoAppleMapsViewProps } from './Map.types';

export const NativeExpoGoogleMapsView = requireNativeViewManager(
  'ExpoGoogleMaps'
) as React.ComponentType<NativeExpoGoogleMapsViewProps>;

export const NativeExpoAppleMapsView = requireNativeViewManager(
  'ExpoAppleMaps'
) as React.ComponentType<NativeExpoAppleMapsViewProps>;

export const NativeExpoAppleMapsModule = NativeModulesProxy.ExpoAppleMaps;
export const NativeExpoGoogleMapsModule = NativeModulesProxy.ExpoGoogleMaps;
