import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { diff } from 'deep-object-diff';
import { Asset } from 'expo-asset';
import { AVPlaybackStatus, ResizeMode, Video, VideoFullscreenUpdateEvent } from 'expo-av';
import React from 'react';
import { Platform, StyleProp, Text, View, ViewStyle } from 'react-native';

import { AndroidImplementationSelector } from './AndroidImplementationSelector';
import Player from './Player';
import { Colors } from '../../../constants';

type VideoPlayerSource =
  | number
  | {
      uri: string;
      overrideFileExtensionAndroid?: string;
      headers?: {
        [fieldName: string]: string;
      };
    }
  | Asset;

export default function VideoPlayer(props: {
  style?: StyleProp<ViewStyle>;
  sources: VideoPlayerSource[];
}) {
  const [sourceIndex, setIndex] = React.useState(0);
  const [errorMessage, setError] = React.useState<undefined | string>(undefined);
  const [useNativeControls, setUseNativeControls] = React.useState(false);
  const [resizeMode, setResizeMode] = React.useState<ResizeMode>(ResizeMode.CONTAIN);
  const prevStatus = React.useRef<AVPlaybackStatus | null>(null);

  const [status, setStatus] = React.useState<AVPlaybackStatus>({
    isLoaded: false,
  });

  const video = React.useRef<Video>(null);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    console.log('onPlaybackStatusUpdate: ', diff(prevStatus.current || {}, status));
    prevStatus.current = status;
    setStatus(status);
  };

  const handleFullScreenUpdate = (event: VideoFullscreenUpdateEvent) =>
    console.log('onFullscreenUpdate', event);

  const playAsync = async () => video.current?.playAsync();

  const pauseAsync = async () => video.current?.pauseAsync();

  const replayAsync = async () => video.current?.replayAsync();

  const setPositionAsync = async (position: number) => video.current?.setPositionAsync(position);

  const setIsLoopingAsync = async (isLooping: boolean) =>
    video.current?.setIsLoopingAsync(isLooping);

  const setIsMutedAsync = async (isMuted: boolean) => video.current?.setIsMutedAsync(isMuted);

  const setRateAsync = async (rate: number, shouldCorrectPitch: boolean) =>
    video.current?.setRateAsync(rate, shouldCorrectPitch);

  const toggleNativeControls = () =>
    setUseNativeControls((useNativeControls) => !useNativeControls);

  const openFullscreen = () => video.current?.presentFullscreenPlayer();

  const changeSource = () => {
    setIndex((index) => (index + 1) % props.sources.length);
  };
  const isMediaPlayerImplementation = () => status.androidImplementation === 'MediaPlayer';

  const toggleAndroidImplementation = async () => {
    if (status.isLoaded) {
      if (status.isPlaying) {
        await video.current?.pauseAsync();
      }
      await video.current?.unloadAsync();
    }
    await video.current?.loadAsync(props.sources[sourceIndex], {
      androidImplementation: isMediaPlayerImplementation() ? 'SimpleExoPlayer' : 'MediaPlayer',
    });
  };
  return (
    <View>
      <AndroidImplementationSelector
        onToggle={toggleAndroidImplementation}
        title={`Current player: ${
          isMediaPlayerImplementation() ? 'MediaPlayer' : 'SimpleExoPlayer'
        }`}
        toggled={isMediaPlayerImplementation()}
      />

      <Player
        style={props.style}
        errorMessage={errorMessage}
        isLoaded={status.isLoaded}
        isLooping={status.isLoaded ? status.isLooping : false}
        rate={status.isLoaded ? status.rate : 1}
        positionMillis={status.isLoaded ? status.positionMillis : 0}
        durationMillis={status.isLoaded ? status.durationMillis || 0 : 0}
        shouldCorrectPitch={status.isLoaded ? status.shouldCorrectPitch : false}
        isPlaying={status.isLoaded ? status.isPlaying : false}
        isMuted={status.isLoaded ? status.isMuted : false}
        volume={status.isLoaded ? status.volume : 1}
        audioPan={status.isLoaded ? status.audioPan : 0}
        playAsync={playAsync}
        pauseAsync={pauseAsync}
        replayAsync={replayAsync}
        nextAsync={changeSource}
        setPositionAsync={setPositionAsync}
        setIsLoopingAsync={setIsLoopingAsync}
        setIsMutedAsync={setIsMutedAsync}
        setRateAsync={setRateAsync}
        setVolume={(volume, audioPan) => video.current?.setVolumeAsync(volume, audioPan)}
        extraButtons={[
          () => (
            <ResizeModeSegmentedControl key="resizeModeControl" onValueChange={setResizeMode} />
          ),
          {
            iconName: 'options',
            title: 'Native controls',
            onPress: toggleNativeControls,
            active: useNativeControls,
          },
          {
            iconName: 'resize',
            title: 'Open full screen',
            onPress: openFullscreen,
            active: false,
          },
        ]}
        header={
          <Video
            useNativeControls={useNativeControls}
            ref={video}
            source={props.sources[sourceIndex]}
            resizeMode={resizeMode}
            onError={setError}
            style={{ height: 300 }}
            progressUpdateIntervalMillis={100}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onFullscreenUpdate={handleFullScreenUpdate}
          />
        }
      />
    </View>
  );
}

function ResizeModeSegmentedControl({
  onValueChange,
}: {
  onValueChange: (value: ResizeMode) => void;
}) {
  const resizeMap: Record<string, undefined | ResizeMode> = {
    stretch: ResizeMode.STRETCH,
    contain: ResizeMode.CONTAIN,
    cover: ResizeMode.COVER,
  };
  const [index, setIndex] = React.useState(1);
  let control;
  if (Platform.OS === 'ios') {
    control = (
      <SegmentedControl
        values={Object.keys(resizeMap)}
        fontStyle={{ color: Colors.tintColor }}
        selectedIndex={index}
        tintColor="white"
        onChange={(event) => {
          setIndex(event.nativeEvent.selectedSegmentIndex);
        }}
        onValueChange={(value) => {
          const mappedValue = resizeMap[value];
          if (mappedValue) {
            onValueChange(mappedValue);
          }
        }}
      />
    );
  } else {
    // Segmented control looks broken in this situation outside of iOS, so use text instead
    control = Object.keys(resizeMap).map((mode, i) => (
      <Text
        onPress={() => {
          setIndex(i);
          onValueChange(resizeMap[mode]!);
        }}
        key={mode}
        style={{
          textAlign: 'center',
          color: Colors.tintColor,
          fontWeight: index === i ? 'bold' : 'normal',
          marginTop: i === 0 ? 0 : 8,
          fontSize: 12,
        }}>
        {mode}
      </Text>
    ));
    control = <View style={{ marginTop: -5 }}>{control}</View>;
  }
  return (
    <View
      style={{
        alignItems: 'stretch',
        paddingBottom: 6,
        margin: 10,
        justifyContent: 'flex-end',
        flex: 1,
      }}>
      {control}
      {Platform.OS === 'ios' ? (
        <Text
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: Colors.tintColor,
            marginTop: 8,
            fontSize: 12,
          }}>
          Resize Mode
        </Text>
      ) : null}
    </View>
  );
}
