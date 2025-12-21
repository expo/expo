import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const playerFactory = (player: VideoPlayer) => {
  player.loop = true;
  player.muted = true;
  player.play();
};

export default function VideoChangePlayerOutputScreen() {
  // Whether to move the player into the new view without unmounting it from the previous view.
  // This is unsupported on Android (single player in multiple VideoViews), but may happen quite often
  // in real usage by unaware users. We want to check if expo-video gracefully handles
  // this by displaying the video in the last `VideoView` to use it.
  const [useIncorrectReplace, setUseIncorrectReplace] = useState(false);

  const player = useVideoPlayer(bigBuckBunnySource, playerFactory);
  const player2 = useVideoPlayer(elephantsDreamSource, playerFactory);
  const players = useRef([
    { ref: player, viewIndex: 0 },
    { ref: player2, viewIndex: 1 },
  ]);
  const [viewPlayers, setViewPlayers] = useState([player, player2, null, null]);

  const advancePlayer = useCallback(
    (playerIndex: number) => {
      const currentIndex = players.current[playerIndex].viewIndex;
      const newIndex = (currentIndex + 1) % 4;
      movePlayerTo(playerIndex, newIndex);
    },
    [viewPlayers, useIncorrectReplace]
  );

  const movePlayerTo = useCallback(
    (playerIndex: number, newViewIndex: number) => {
      const currentIndex = players.current[playerIndex].viewIndex;
      const newViewPlayers = [...viewPlayers];

      if (!useIncorrectReplace) {
        newViewPlayers[currentIndex] = null;
      }
      newViewPlayers[newViewIndex] = players.current[playerIndex].ref;
      setViewPlayers(newViewPlayers);

      players.current[playerIndex].viewIndex = newViewIndex;
    },
    [viewPlayers, useIncorrectReplace]
  );

  return (
    <View style={styles.contentContainer}>
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <VideoView
            key={i}
            style={screenStyles.smallVideo}
            player={viewPlayers[i]}
            nativeControls={false}
          />
        ))}
      <Button title="Move player 1 to the next video view" onPress={() => advancePlayer(0)} />
      <Button title="Move player 2 from the next video view" onPress={() => advancePlayer(1)} />

      <Text style={styles.centerText}>
        Use buttons below to check the following sequence: {'\n'} 1st button {'->'} 2nd button{' '}
        {'->'} 1st button. {'\n'} At the end the first player should be playing in the view.
      </Text>
      <Button title="Move player 1 to first video view" onPress={() => movePlayerTo(0, 0)} />
      <Button title="Move player 2 to first video view" onPress={() => movePlayerTo(1, 0)} />
      <TitledSwitch
        title="Move to new view without unmounting from the old one first"
        value={useIncorrectReplace}
        setValue={setUseIncorrectReplace}
        style={screenStyles.switch}
        titleStyle={styles.switchTitle}
      />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  switch: {
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  smallVideo: {
    width: 150,
    aspectRatio: 16 / 9,
    height: 'auto',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'gray',
  },
});
