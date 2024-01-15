import { useAudioPlayer, AudioSource } from 'expo-audio';
import { StatusEvent } from 'expo-audio/build/AudioModule.types';
import { useCallback, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from '../AV/Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style: StyleProp<ViewStyle>;
};

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const player = useAudioPlayer(
    source,
    useCallback((status: StatusEvent) => {
      setState({
        ...state,
        ...status,
        positionMillis: status.currentPosition ?? 0,
        durationMillis: isNaN(status.duration) ? 0 : status.duration,
      });
    }, [])
  );

  const [state, setState] = useState({
    androidImplementation: 'SimpleExoPlayer',
    isLoaded: true,
    isLooping: false,
    positionMillis: player.currentPosition,
    durationMillis: isNaN(player.duration) ? 0 : player.duration,
    rate: player.rate,
    volume: player.volume,
    isPlaying: player.isPlaying,
    audioPan: 0,
    shouldCorrectPitch: false,
  });

  const [isMuted, setMuted] = useState(false);

  const play = () => {
    player.play();
  };

  const pause = () => {
    player.pause();
  };

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

  return (
    <Player
      {...state}
      rate={1}
      isMuted={isMuted}
      style={style}
      playAsync={play}
      pauseAsync={pause}
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
