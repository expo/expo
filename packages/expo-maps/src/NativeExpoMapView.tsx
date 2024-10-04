import { requireNativeViewManager, NativeModulesProxy } from 'expo-modules-core';
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
