import { useAudioPlayer, AudioSource, useAudioPlayerStatus } from 'expo-audio';
import { StyleProp, ViewStyle } from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
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
      extraIndicator={<JsiAudioBar isPlaying={status.playing} player={player} />}
    />
  );
}
