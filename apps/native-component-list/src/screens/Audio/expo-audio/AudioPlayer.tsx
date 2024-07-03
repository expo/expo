import { useAudioPlayer, AudioSource } from 'expo-audio';
import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const [player, status] = useAudioPlayer(source);

  const setVolume = (volume: number) => {
    player.volume = volume;
  };

  const setIsMuted = (isMuted: boolean) => {
    player.muted = isMuted;
  };

  const setIsLooping = (isLooping: boolean) => {
    player.loop = isLooping;
  };

  const setRate = (rate: number, shouldCorrectPitch: boolean) => {
    player.shouldCorrectPitch = shouldCorrectPitch;
    player.setPlaybackRate(rate);
  };

  useEffect(() => {
    return () => player.remove();
  }, []);

  return (
    <Player
      {...status}
      audioPan={0}
      volume={player.volume}
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
