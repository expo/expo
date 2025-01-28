import { useAudioPlayer, AudioSource, useAudioPlayerStatus } from 'expo-audio';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

const localSource = require('../../../../assets/sounds/polonez.mp3');
const remoteSource =
  'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02';

export default function AudioPlayer({ source, style }: AudioPlayerProps) {
  const [currentSource, setCurrentSource] = React.useState(source);
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

  const replaceSource = () => {
    const source = currentSource === localSource ? remoteSource : localSource;
    player.replace(source);
    setCurrentSource(source);
  };

  return (
    <Player
      {...status}
      audioPan={0}
      volume={player.volume}
      style={style}
      play={() => player.play()}
      pause={() => player.pause()}
      replace={() => replaceSource()}
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
