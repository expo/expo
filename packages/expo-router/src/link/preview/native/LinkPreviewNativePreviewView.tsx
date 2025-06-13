import { requireNativeView } from 'expo';
import { useState } from 'react';

import { LinkPreviewNativePreviewViewProps } from './types';

const NativeView: React.ComponentType<
  LinkPreviewNativePreviewViewProps & {
    onSetSize: (event: { nativeEvent: { width: number; height: number } }) => void;
  }
> = requireNativeView('ExpoRouterLinkPreviewNative', 'LinkPreviewNativePreviewView');

export default function LinkPreviewNativePreviewNativeView(props: LinkPreviewNativePreviewViewProps) {
  // TODO: Replace with proper yoga styling
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | undefined>(
    undefined
  );
  const customStyle = {
    position: 'absolute',
    width: previewSize?.width,
    height: previewSize?.height,
  } as const;
  const style = Array.isArray(props.style)
    ? [...props.style, customStyle]
    : [props.style, customStyle];
  return (
    <NativeView
      {...props}
      onSetSize={({ nativeEvent: size }) => setPreviewSize(size)}
      style={style}
    />
  );
}
