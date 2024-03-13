import { Asset } from 'expo-asset';
import { useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from '../AV/Player';

type PlaybackSource =
  | number
  | {
      uri: string;
      overrideFileExtensionAndroid?: string;
      headers?: {
        [fieldName: string]: string;
      };
    }
  | Asset;

type AudioPlayerProps = {
  source: PlaybackSource;
  style: StyleProp<ViewStyle>;
};

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const [state, setState] = useState({
    androidImplementation: 'SimpleExoPlayer',
    isMuted: false,
    isPlaying: false,
    isLoaded: true,
    isLooping: false,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1,
    volume: 1,
    audioPan: 0,
    shouldCorrectPitch: false,
  });

  const player = useAudioPlayer(
    'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02'
  );

  useEffect(() => {
    return () => player.pause();
  }, []);

  const play = () => {
    player.play();
    setState({ ...state, isPlaying: true });
  };

  const pause = () => {
    player.pause();
    setState({ ...state, isPlaying: false });
  };

  const setVolume = (volume: number) => {
    player.setVolume(volume);
    setState({ ...state, volume });
  };

  const setIsMuted = () => {
    player.isMuted = !player.isMuted;
    setState({ ...state, isMuted: player.isMuted });
  };

  const setIsLooping = (isLooping: boolean) => {
    player.isLoopingEnabled(isLooping);
    setState({ ...state, isLooping });
  };

  const setRate = (rate: number) => {
    player.setRate(rate);
    setState({ ...state, rate });
  };

  return (
    <Player
      {...state}
      positionMillis={player.currentTime}
      rate={1}
      style={style}
      playAsync={play}
      pauseAsync={pause}
      replayAsync={() => {}}
      setPositionAsync={(position: number) => {
        return new Promise(() => {});
      }}
      setIsLoopingAsync={setIsLooping}
      setRateAsync={setRate}
      setIsMutedAsync={setIsMuted}
      setVolume={setVolume}
    />
  );
}
