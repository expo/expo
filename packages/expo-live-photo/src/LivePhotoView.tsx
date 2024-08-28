import { Platform, requireNativeViewManager, UnavailabilityError } from 'expo-modules-core';
import * as React from 'react';
import { NativeSyntheticEvent, Text, View } from 'react-native';

import {
  LivePhotoLoadError,
  LivePhotoViewProps,
  LivePhotoViewType,
  PlaybackStyle,
} from './LivePhoto.types';
import { isAvailable } from './LivePhotoModule';

type NativeLivePhotoViewProps = LivePhotoViewProps & {
  ref: React.MutableRefObject<LivePhotoViewType | null>;
  onLoadError: (event: NativeSyntheticEvent<LivePhotoLoadError>) => void;
};

const NativeView: React.ComponentType<NativeLivePhotoViewProps> | null = isAvailable()
  ? requireNativeViewManager('ExpoLivePhoto')
  : null;

export default React.forwardRef((props: LivePhotoViewProps, ref) => {
  const nativeRef = React.useRef<LivePhotoViewType | null>(null);

  React.useImperativeHandle(ref, () => ({
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
    return (
      <View>
        <Text>Expo-live-photo is not available on {Platform.OS}</Text>
      </View>
    );
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
