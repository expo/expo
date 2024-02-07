import { useAudioPlayer, AudioSource, AudioPlayerState } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/AudioModule.types';
import { useCallback, useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const player = useAudioPlayer(
    source,
    useCallback((status: AudioStatus) => {
      setState({
        ...state,
        ...status,
        positionMillis: status.currentPosition ?? 0,
        durationMillis: isNaN(status.totalDuration) ? 0 : status.totalDuration,
        volume: player.volume,
      });
    }, [])
  );

  const [state, setState] = useState<AudioPlayerState>({
    androidImplementation: 'SimpleExoPlayer',
    isLoaded: player.isLoaded,
    isLooping: player.isLooping,
    isMuted: player.isMuted,
    positionMillis: player.currentPosition,
    durationMillis: isNaN(player.totalDuration) ? 0 : player.totalDuration,
    rate: player.rate,
    volume: player.volume,
    isPlaying: player.isPlaying,
    audioPan: 0,
    shouldCorrectPitch: player.shouldCorrectPitch,
  });

  const setVolume = (volume: number) => {
    player.volume = volume;
    setState({ ...state, volume });
  };

  const setIsMuted = (isMuted: boolean) => {
    player.isMuted = isMuted;
    setState({ ...state, isMuted });
  };

  const setIsLooping = (isLooping: boolean) => {
    player.isLooping = isLooping;
    setState({ ...state, isLooping });
  };

  const setRate = (rate: number, shouldCorrectPitch: boolean) => {
    player.shouldCorrectPitch = shouldCorrectPitch;
    player.setRate(rate);
    setState({ ...state, rate: player.rate, shouldCorrectPitch });
  };

  useEffect(() => {
    return () => player.destroy();
  }, []);

  return (
    <Player
      {...state}
      style={style}
      play={() => player.play()}
      pause={() => player.pause()}
      replay={() => {
        return player.seekTo(0);
      }}
      setPosition={(position: number) => {
        return player.seekTo(position);
      }}
      setIsLooping={setIsLooping}
      setRate={setRate}
      setIsMuted={setIsMuted}
      setVolume={setVolume}
    />
  );
}
