import { Platform, requireNativeViewManager, UnavailabilityError } from 'expo-modules-core';
import { MutableRefObject, forwardRef, useRef, useImperativeHandle } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import {
  LivePhotoLoadError,
  LivePhotoViewProps,
  LivePhotoViewStatics,
  LivePhotoViewType,
  PlaybackStyle,
} from './LivePhoto.types';

type NativeLivePhotoViewProps = LivePhotoViewProps & {
  ref: MutableRefObject<LivePhotoViewType | null>;
  onLoadError: (event: NativeSyntheticEvent<LivePhotoLoadError>) => void;
};

const NativeView: React.ComponentType<NativeLivePhotoViewProps> | null = isAvailable()
  ? requireNativeViewManager('ExpoLivePhoto')
  : null;

function isAvailable() {
  return Platform.OS === 'ios';
}

const LivePhotoView = forwardRef((props: LivePhotoViewProps, ref) => {
  const nativeRef = useRef<LivePhotoViewType | null>(null);

  useImperativeHandle(ref, () => ({
    startPlayback: (playbackStyle?: PlaybackStyle) => {
      if (!isAvailable()) {
        throw new UnavailabilityError('expo-live-photo', 'startPlayback');
      }
      nativeRef.current?.startPlayback(playbackStyle ?? 'full');
    },
    stopPlayback: () => {
      if (!isAvailable()) {
        throw new UnavailabilityError('expo-live-photo', 'stopPlayback');
      }
      nativeRef.current?.stopPlayback();
    },
  }));

  if (!isAvailable() || !NativeView) {
    console.warn(`expo-live-photo is not available on ${Platform.OS}`);
    return null;
  }

  return (
    <NativeView
      {...props}
      ref={nativeRef}
      onLoadError={(event: any) => {
        props.onLoadError?.(event.nativeEvent);
      }}
    />
  );
});

const LivePhotoViewWithStatics = LivePhotoView as typeof LivePhotoView & LivePhotoViewStatics;
LivePhotoViewWithStatics.isAvailable = isAvailable;

export default LivePhotoViewWithStatics;
