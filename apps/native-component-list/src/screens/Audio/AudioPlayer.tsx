import { useAudioPlayer, AudioSource, AudioPlayerState, AudioStatus } from 'expo-audio';
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
        positionMillis: status.currentTime ?? 0,
        durationMillis: isNaN(status.duration) ? 0 : status.duration,
        volume: player.volume,
      });
    }, [])
  );

  const [state, setState] = useState<AudioPlayerState>({
    isLoaded: player.isLoaded,
    isLooping: player.loop,
    isMuted: player.muted,
    positionMillis: player.currentTime,
    durationMillis: isNaN(player.duration) ? 0 : player.duration,
    rate: player.playbackRate,
    volume: player.volume,
    playing: player.playing,
    audioPan: 0,
    shouldCorrectPitch: player.shouldCorrectPitch,
  });

  const setVolume = (volume: number) => {
    player.volume = volume;
    setState({ ...state, volume });
  };

  const setIsMuted = (isMuted: boolean) => {
    player.muted = isMuted;
    setState({ ...state, isMuted });
  };

  const setIsLooping = (isLooping: boolean) => {
    player.loop = isLooping;
    setState({ ...state, isLooping });
  };

  const setRate = (rate: number, shouldCorrectPitch: boolean) => {
    player.shouldCorrectPitch = shouldCorrectPitch;
    player.setPlaybackRate(rate);
    setState({ ...state, rate: player.playbackRate, shouldCorrectPitch });
  };

  useEffect(() => {
    return () => player.release();
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
