import SegmentedControl from '@react-native-community/segmented-control';
import { diff } from 'deep-object-diff';
import { Asset } from 'expo-asset';
import { AVPlaybackStatus, ResizeMode, Video, VideoFullscreenUpdateEvent } from 'expo-av';
import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import Player from './Player';
import { Colors } from '../../constants';

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

function ResizeModeSegmentedControl({
  onValueChange,
}: {
  onValueChange: (value: ResizeMode) => void;
}) {
  const resizeMap = {
    contain: ResizeMode.CONTAIN,
    cover: ResizeMode.COVER,
    stretch: ResizeMode.STRETCH,
  };
  const data = Object.keys(resizeMap);
  const [index, setIndex] = React.useState(0);
  return (
    <View
      style={{
        alignItems: 'stretch',
        paddingBottom: 6,
        margin: 10,
        justifyContent: 'flex-end',
        flex: 1,
      }}>
      <SegmentedControl
        values={data}
        fontStyle={{ color: Colors.tintColor }}
        selectedIndex={index}
        tintColor={'white'}
        onChange={event => {
          setIndex(event.nativeEvent.selectedSegmentIndex);
        }}
        onValueChange={value => onValueChange(resizeMap[value])}
      />
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
    </View>
  );
}

export default function VideoPlayer(props: {
  style?: StyleProp<ViewStyle>;
  sources: VideoPlayerSource[];
}) {
  const [sourceIndex, setIndex] = React.useState(0);
  const [errorMessage, setError] = React.useState<undefined | string>(undefined);
  const [useNativeControls, setUseNativeControls] = React.useState(false);
  const [resizeMode, setResizeMode] = React.useState<ResizeMode>(Video.RESIZE_MODE_CONTAIN);
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

  const toggleNativeControls = () => setUseNativeControls(useNativeControls => !useNativeControls);

  const openFullscreen = () => video.current?.presentFullscreenPlayer();

  const changeSource = () => {
    setIndex(index => (index + 1) % props.sources.length);
  };

  const resizeModeButton = React.useMemo(() => {}, []);

  return (
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
      playAsync={playAsync}
      pauseAsync={pauseAsync}
      replayAsync={replayAsync}
      nextAsync={changeSource}
      setPositionAsync={setPositionAsync}
      setIsLoopingAsync={setIsLoopingAsync}
      setIsMutedAsync={setIsMutedAsync}
      setRateAsync={setRateAsync}
      extraButtons={[
        {
          iconName: 'options',
          title: 'Native controls',
          onPress: toggleNativeControls,
          active: useNativeControls,
        },
        // {
        //   iconName: 'move',
        //   title: 'Resize mode – stretch',
        //   onPress: () => setResizeMode(Video.RESIZE_MODE_STRETCH),
        //   active: resizeMode === Video.RESIZE_MODE_STRETCH,
        // },
        () => <ResizeModeSegmentedControl onValueChange={setResizeMode} />,
        // {
        //   iconName: 'log-in',
        //   title: `Resize mode – ${resizeMode === Video.RESIZE_MODE_CONTAIN ? 'cover' : 'contain'}`,
        //   onPress: () => setResizeMode(Video.RESIZE_MODE_CONTAIN),
        //   active: resizeMode === Video.RESIZE_MODE_CONTAIN,
        // },
        // {
        //   iconName: 'qr-scanner',
        //   title: 'Resize mode – cover',
        //   onPress: () => setResizeMode(Video.RESIZE_MODE_COVER),
        //   active: resizeMode === Video.RESIZE_MODE_COVER,
        // },
        {
          iconName: 'resize',
          title: 'Open full screen',
          onPress: openFullscreen,
          active: false,
        },
      ]}
      header={
        <View style={{ flex: 1, backgroundColor: 'black' }}>
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
        </View>
      }
    />
  );
}
