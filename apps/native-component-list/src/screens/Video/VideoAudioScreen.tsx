import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useVideoPlayer, VideoView, AudioMixingMode } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const mixingModes: AudioMixingMode[] = ['mixWithOthers', 'duckOthers', 'auto', 'doNotMix'];
export default function VideoNowPlayingScreen() {
  const view1Ref = useRef<VideoView>(null);
  const [volume, setVolume] = useState(1);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [player1MixingModeIndex, setPlayer1MixingModeIndex] = useState(2);
  const [player2MixingModeIndex, setPlayer2MixingModeIndex] = useState(2);
  const [player1IsMuted, setPlayer1IsMuted] = useState(true);
  const [player2IsMuted, setPlayer2IsMuted] = useState(true);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.muted = player1IsMuted;
    player.showNowPlayingNotification = showNowPlaying;
    player.staysActiveInBackground = true;
    player.audioMixingMode = mixingModes[player1MixingModeIndex];
    player.play();
  });

  const player2 = useVideoPlayer(elephantsDreamSource, (player) => {
    player.loop = true;
    player.muted = player2IsMuted;
    player.showNowPlayingNotification = showNowPlaying;
    player.staysActiveInBackground = true;
    player.audioMixingMode = mixingModes[player2MixingModeIndex];
    player.play();
  });

  const applyShowNowPlaying = useCallback(
    (value: boolean) => {
      player.showNowPlayingNotification = value;
      player2.showNowPlayingNotification = value;
      setShowNowPlaying(value);
    },
    [player, showNowPlaying]
  );

  const applyPlayer1Mute = useCallback(
    (value: boolean) => {
      player.muted = value;
      setPlayer1IsMuted(value);
    },
    [player]
  );

  const applyPlayer2Mute = useCallback(
    (value: boolean) => {
      player2.muted = value;
      setPlayer2IsMuted(value);
    },
    [player2]
  );

  const applyVolume = useCallback(
    (value: number) => {
      player.volume = value;
      player2.volume = value;
      setVolume(value);
    },
    [player, player2]
  );

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.row, { marginBottom: 20 }]}>
        <VideoView
          ref={view1Ref}
          player={player}
          style={{ width: 160, height: 90 }}
          allowsPictureInPicture
        />
        <VideoView player={player2} style={{ width: 160, height: 90 }} />
      </View>
      <ScrollView style={styles.controlsContainer}>
        <Text style={styles.switchTitle}>Volume</Text>
        <Slider
          style={{ alignSelf: 'stretch' }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={applyVolume}
        />

        <Text style={styles.switchTitle}>Player 1 AudioMode</Text>
        <SegmentedControl
          values={mixingModes}
          selectedIndex={player1MixingModeIndex}
          onValueChange={(value) => {
            const audioMode = value as AudioMixingMode;
            player.audioMixingMode = audioMode;
            setPlayer1MixingModeIndex(mixingModes.indexOf(audioMode));
          }}
          backgroundColor="#e5e5e5"
        />
        <Text style={styles.switchTitle}>Player 2 AudioMode</Text>

        <SegmentedControl
          values={mixingModes}
          selectedIndex={player2MixingModeIndex}
          onValueChange={(value) => {
            const audioMode = value as AudioMixingMode;
            player2.audioMixingMode = audioMode;
            setPlayer2MixingModeIndex(mixingModes.indexOf(audioMode));
          }}
          backgroundColor="#e5e5e5"
        />
        <TitledSwitch
          title="Shows Now Playing Notification"
          value={showNowPlaying}
          setValue={applyShowNowPlaying}
          style={styles.switch}
          titleStyle={styles.switchTitle}
        />
        <View style={styles.row}>
          <TitledSwitch
            value={player1IsMuted}
            setValue={applyPlayer1Mute}
            title="Mute Player 1"
            style={styles.switch}
          />
          <TitledSwitch
            value={player2IsMuted}
            setValue={applyPlayer2Mute}
            title="Mute Player 2"
            style={styles.switch}
          />
        </View>
        <Button
          style={styles.button}
          title="Enter PiP"
          onPress={() => view1Ref.current?.startPictureInPicture()}
        />
        <Text style={styles.centerText}>
          Picture in Picture and Now Playing Notification rely on the AudioMode on iOS for "auto"
          and "doNotMix" modes the notification should be visible.
        </Text>
      </ScrollView>
    </View>
  );
}
