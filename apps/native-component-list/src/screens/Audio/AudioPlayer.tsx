import { useAudioPlayer, AudioSource } from 'expo-audio';
import { AudioStatus } from 'expo-audio/build/AudioModule.types';
import { useCallback, useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from '../AV/Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style: StyleProp<ViewStyle>;
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
        rate: player.rate,
        volume: player.volume,
      });
    }, [])
  );

  const [state, setState] = useState({
    androidImplementation: 'SimpleExoPlayer',
    isLoaded: true,
    isLooping: false,
    positionMillis: player.currentPosition,
    durationMillis: isNaN(player.totalDuration) ? 0 : player.totalDuration,
    rate: player.rate,
    volume: player.volume,
    isPlaying: player.isPlaying,
    audioPan: 0,
    shouldCorrectPitch: false,
  });

  const [isMuted, setMuted] = useState(false);

  const setVolume = (volume: number) => {
    player.volume = volume;
    setState({ ...state, volume });
  };

  const setIsMuted = (isMuted: boolean) => {
    player.isMuted = isMuted;
    setMuted(player.isMuted);
  };

  const setIsLooping = (isLooping: boolean) => {
    player.isLooping = isLooping;
    setState({ ...state, isLooping });
  };

  const setRate = (rate: number) => {
    player.rate = rate;
    setState({ ...state, rate });
  };

  useEffect(() => {
    return () => player.pause();
  }, []);

  return (
    <Player
      {...state}
      rate={1}
      isMuted={isMuted}
      style={style}
      playAsync={() => player.play()}
      pauseAsync={() => player.pause()}
      replayAsync={() => {
        return player.seekTo(0);
      }}
      setPositionAsync={(position: number) => {
        return player.seekTo(position);
      }}
      setIsLoopingAsync={setIsLooping}
      setRateAsync={setRate}
      setIsMutedAsync={setIsMuted}
      setVolume={setVolume}
    />
  );
}
