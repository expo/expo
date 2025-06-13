import { Text } from 'react-native';

import {
  LinkPreviewNativePreviewViewProps,
  LinkPreviewNativeTriggerViewProps,
  LinkPreviewNativeViewProps,
  type LinkPreviewNativeActionViewProps,
} from './types';

const NotAvailableOnThisPlatformComponent = () => {
  console.warn('Peek and pop preview is only available on iOS');
  return <Text style={{ color: 'red' }}>Peek and pop preview is only available on iOS</Text>;
};

export const LinkPreviewNativeView = (_: LinkPreviewNativeViewProps) => NotAvailableOnThisPlatformComponent();
export const LinkPreviewNativePreviewView = (_: LinkPreviewNativePreviewViewProps) =>
  NotAvailableOnThisPlatformComponent();
export const LinkPreviewNativeTriggerView = (_: LinkPreviewNativeTriggerViewProps) =>
  NotAvailableOnThisPlatformComponent();
export const LinkPreviewNativeActionView = (_: LinkPreviewNativeActionViewProps) =>
  NotAvailableOnThisPlatformComponent();
