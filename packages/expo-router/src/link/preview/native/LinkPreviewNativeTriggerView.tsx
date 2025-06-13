import { requireNativeView } from 'expo';

import { LinkPreviewNativeTriggerViewProps } from './types';

const NativeView: React.ComponentType<LinkPreviewNativeTriggerViewProps> = requireNativeView(
  'ExpoRouterLinkPreviewNative',
  'LinkPreviewNativeTriggerView'
);

export default function LinkPreviewNativeTriggerNativeView(props: LinkPreviewNativeTriggerViewProps) {
  return <NativeView {...props} />;
}
