import { requireNativeView } from 'expo';

import { LinkPreviewNativeActionViewProps } from './types';

const NativeView: React.ComponentType<LinkPreviewNativeActionViewProps> = requireNativeView(
  'ExpoRouterLinkPreviewNative',
  'LinkPreviewNativeActionView'
);

export default function LinkPreviewNativeActionNativeView(props: LinkPreviewNativeActionViewProps) {
  return <NativeView {...props} />;
}
