'use client';

import { requireNativeView } from 'expo';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import type { AppEntityViewProps } from './AppEntityView.types';
import ExpoAppIntents from './ExpoAppIntentsModule';

const NativeAppEntityView: ComponentType<AppEntityViewProps> | null = ExpoAppIntents
  ? requireNativeView<AppEntityViewProps>('ExpoAppIntents', 'AppEntityView')
  : null;

export default function AppEntityView(props: AppEntityViewProps) {
  if (!NativeAppEntityView) {
    const { entity: _entity, entityId: _entityId, ...viewProps } = props;
    return <View {...viewProps} />;
  }
  return <NativeAppEntityView {...props} collapsable={false} />;
}
