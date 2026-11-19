'use client';

import { View } from 'react-native';

import type { AppEntityViewProps } from './AppEntityView.types';

/**
 * A wrapper that associates its contents with an App Entity so Apple Intelligence and Siri
 * can understand which entity is visible onscreen. Use it around React Native views; for `@expo/ui`
 * views, use the [`appEntityIdentifier()`](#appintentsappentityidentifierentity-id) modifier instead.
 *
 * > **Note:** The entity association requires iOS 18.4 or later and a project compiled with Xcode 27
 * > or later. The children still render normally when those requirements are not met, on other
 * > platforms, or when the native module is unavailable.
 *
 * @platform ios
 */
export default function AppEntityView({
  entity: _entity,
  entityId: _entityId,
  ...props
}: AppEntityViewProps) {
  return <View {...props} />;
}
