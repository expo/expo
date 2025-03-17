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

const testAssets = [
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/2ed772c1-70a7-4cef-b4af-73923321998b.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/b75223d8-4314-4e8c-b027-fa28d51aba0e.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/7f36e472-5150-416b-91fa-fdce309faaee.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/90d3ba5f-15c1-439c-8c5d-8dcf6558b2a4.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/a2f28309-d15e-4cfe-9082-0002e8eeac72.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/b2921d27-cc48-4129-8527-92ca4873b3b0.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/fdedfbf2-cbba-47ae-b4b0-e0dd8919e38f.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/76376504-81b8-49b4-9b1e-e26f72a8fd66.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/3141f178-29c5-43f5-ac0f-fe76dd5915c7.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/fd0d946e-0e78-44b9-b8f4-1f24cc2bb118.mp3',
  },
];

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

  const setQueue = () => {
    const remoteTestAssets = testAssets.map((test) => test.uri);
    console.log('Setting queue with sources:', JSON.stringify(remoteTestAssets));
    player?.setQueue(remoteTestAssets);
  };

  return (
    <Player
      {...status}
      audioPan={0}
      volume={player.volume}
      style={style}
      play={() => player.play()}
      pause={() => player.pause()}
      replace={() => setQueue()}
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
