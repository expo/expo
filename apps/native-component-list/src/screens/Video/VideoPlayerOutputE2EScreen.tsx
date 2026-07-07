import { useEvent } from 'expo';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';

import Button from '../../components/Button';
import { E2EViewShotContainer } from '../../components/E2EViewShotContainer';
import TitledSwitch from '../../components/TitledSwitch';
import { localVideoSource, starVideoSource } from './videoSources';
import { styles } from './videoStyles';

// Dedicated screen for the player-output e2e test (apps/bare-expo/e2e/expo-video/
// player-output-test.yaml). Like VideoChangePlayerOutputScreen, it moves two players between
// four views, but it's built for screenshot determinism: bundled video sources, players seeked
// to a fixed frame, and machine-readable readiness markers.

type ViewsState = {
  viewPlayers: (VideoPlayer | null)[];
  readyViews: boolean[];
  // Total number of player moves performed so far. Rendered into the viewshot-ready marker's
  // testID so that e2e flows can wait for the exact state after a known number of moves,
  // instead of matching a stale marker from before their taps were processed.
  moveCount: number;
};

const playerFactory = (player: VideoPlayer) => {
  player.loop = true;
  player.muted = true;

  // Don't auto-play: on iOS the Maestro driver waits for the app to be idle before each
  // interaction, and continuously playing video never lets the screen settle, so the e2e taps
  // hang for minutes. The players are seeked to a fixed frame once they load.
};

export default function VideoPlayerOutputE2EScreen() {
  // Whether to move the player into the new view without unmounting it from the previous view.
  // This is unsupported on Android (single player in multiple VideoViews), but may happen quite
  // often in real usage by unaware users. We want to check if expo-video gracefully handles
  // this by displaying the video in the last `VideoView` to use it.
  const [useIncorrectReplace, setUseIncorrectReplace] = useState(false);

  // Bundled sources with distinct content and aspect ratios: the e2e screenshots must not
  // depend on the network, and swapping the players around should stay visually detectable.
  const player = useVideoPlayer(localVideoSource, playerFactory);
  const player2 = useVideoPlayer(starVideoSource, playerFactory);
  const players = useRef([
    { ref: player, viewIndex: 0 },
    { ref: player2, viewIndex: 1 },
  ]);
  const { status: status1 } = useEvent(player, 'statusChange', { status: player.status });
  const { status: status2 } = useEvent(player2, 'statusChange', { status: player2.status });
  const bothReady = status1 === 'readyToPlay' && status2 === 'readyToPlay';

  // Seek both players to a fixed frame as soon as they load, so every screenshot sees the same
  // content. The flow waits for the "Players ready" marker below before moving players around.
  useEffect(() => {
    if (bothReady) {
      player.currentTime = 10;
      player2.currentTime = 10;
    }
  }, [bothReady, player, player2]);

  // Player placement, per-view "frame painted" state and the move counter live in one state
  // object updated atomically, so that rapid successive e2e taps can't interleave (and lose)
  // separate updates. The ready flags gate e2e screenshots: a swapped iOS VideoView stays blank
  // until ready, so it's marked not-ready on swap and flips back from `onFirstFrameRender`.
  // Optimistic so other platforms don't gate.
  const [viewsState, setViewsState] = useState<ViewsState>({
    viewPlayers: [player, player2, null, null],
    readyViews: [true, true, true, true],
    moveCount: 0,
  });

  const framesSettled = viewsState.viewPlayers.every(
    (viewPlayer, index) => viewPlayer == null || viewsState.readyViews[index]
  );

  const markViewRendered = useCallback((viewIndex: number) => {
    setViewsState((previous) => {
      if (previous.readyViews[viewIndex]) {
        return previous;
      }

      const readyViews = [...previous.readyViews];
      readyViews[viewIndex] = true;
      return { ...previous, readyViews };
    });
  }, []);

  const movePlayerTo = useCallback(
    (playerIndex: number, newViewIndex: number) => {
      const currentIndex = players.current[playerIndex].viewIndex;
      const playerRef = players.current[playerIndex].ref;

      setViewsState((previous) => {
        const viewPlayers = [...previous.viewPlayers];
        const readyViews = [...previous.readyViews];
        const previousHolder = previous.viewPlayers[newViewIndex];

        if (!useIncorrectReplace) {
          viewPlayers[currentIndex] = null;
        }
        viewPlayers[newViewIndex] = playerRef;
        // The view receiving the player must repaint; mark it not-ready until
        // `onFirstFrameRender` fires. Re-assigning a player the view already holds doesn't
        // repaint it, so that event would never fire again and the view stays ready.
        if (Platform.OS === 'ios' && previousHolder !== playerRef) {
          readyViews[newViewIndex] = false;
        }

        return { viewPlayers, readyViews, moveCount: previous.moveCount + 1 };
      });

      players.current[playerIndex].viewIndex = newViewIndex;
    },
    [useIncorrectReplace]
  );

  const advancePlayer = useCallback(
    (playerIndex: number) => {
      const currentIndex = players.current[playerIndex].viewIndex;
      const newIndex = (currentIndex + 1) % 4;
      movePlayerTo(playerIndex, newIndex);
    },
    [movePlayerTo]
  );

  return (
    <View style={styles.contentContainer}>
      <E2EViewShotContainer
        testID="view-player-output"
        mode="keep-originals"
        screenshotOutputPath="expo-video/screenshots">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <VideoView
              key={i}
              style={screenStyles.smallVideo}
              player={viewsState.viewPlayers[i]}
              nativeControls={false}
              allowsVideoFrameAnalysis={false}
              onFirstFrameRender={() => markViewRendered(i)}
            />
          ))}
      </E2EViewShotContainer>
      <Button title="Move player 1 to the next video view" onPress={() => advancePlayer(0)} />
      <Button title="Move player 2 to the next video view" onPress={() => advancePlayer(1)} />
      <Button title="Move player 1 to first video view" onPress={() => movePlayerTo(0, 0)} />
      <Button title="Move player 2 to first video view" onPress={() => movePlayerTo(1, 0)} />
      <TitledSwitch
        testID="switch-1"
        title="Move to new view without unmounting from the old one first"
        value={useIncorrectReplace}
        setValue={setUseIncorrectReplace}
        style={screenStyles.switch}
        titleStyle={styles.switchTitle}
      />
      {bothReady && <Text>Players ready</Text>}
      {framesSettled && (
        <Text testID={`viewshot-ready-${viewsState.moveCount}`}>Viewshot ready</Text>
      )}
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
