import { requireNativeView } from 'expo';

import { LinkPreviewNativeViewProps } from './types';

const NativeView: React.ComponentType<LinkPreviewNativeViewProps> = requireNativeView(
  'ExpoRouterLinkPreviewNative',
  'LinkPreviewNativeView'
);

export default function LinkPreviewNativeNativeView(props: LinkPreviewNativeViewProps) {
  return <NativeView {...props} />;
}
