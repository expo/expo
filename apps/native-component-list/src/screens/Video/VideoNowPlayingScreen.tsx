import { useEvent } from 'expo';
import { NowPlayingActionSlot, useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

export default function VideoNowPlayingScreen() {
  const [showNowPlaying, setShowNowPlaying] = useState(true);
  const [currentSource, setCurrentSource] = useState(bigBuckBunnySource);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.showNowPlayingNotification = showNowPlaying;
    player.staysActiveInBackground = true;
    player.currentTime = 10;
    player.play();
  });

  const applyShowNowPlaying = useCallback(
    (value: boolean) => {
      player.showNowPlayingNotification = value;
      setShowNowPlaying(value);
    },
    [player, showNowPlaying]
  );

  const toggleSource = useCallback(() => {
    if (currentSource === bigBuckBunnySource) {
      player.replaceAsync(elephantsDreamSource);
      setCurrentSource(elephantsDreamSource);
    } else {
      player.replaceAsync(bigBuckBunnySource);
      setCurrentSource(bigBuckBunnySource);
    }
  }, [player, currentSource]);

  const nowPlayingActionPressed = useEvent(player, 'nowPlayingActionPressed');

  useEffect(() => {
    switch (nowPlayingActionPressed?.action) {
      case 'FAVORITE_ACTION':
        player.nowPlayingActions = [
          {
            action: 'UNFAVORITE_ACTION',
            iconName: 'heart_full',
            displayName: 'Favorite',
          },
        ];
        break;
      case 'UNFAVORITE_ACTION':
        player.nowPlayingActions = [
          {
            action: 'FAVORITE_ACTION',
            iconName: 'heart',
            displayName: 'Unfavorite',
          },
        ];
        break;
    }
  }, [nowPlayingActionPressed]);

  return (
    <View style={styles.contentContainer}>
      <VideoView player={player} style={styles.video} />
      <ScrollView style={styles.controlsContainer}>
        <Button style={styles.button} title="Toggle source" onPress={toggleSource} />
        <View style={styles.row}>
          <TitledSwitch
            title="Shows Now Playing Notification"
            value={showNowPlaying}
            setValue={applyShowNowPlaying}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
        <Text style={styles.centerText}>Media Session Custom Buttons: </Text>
        <Button
          title="Set Heart Button With Toggle"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
              },
            ];
          }}
        />
        <Button
          title="Set Default Seek Buttons"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = null;
          }}
        />
        <Button
          title="Clear Buttons"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [];
          }}
        />
        <Button
          title="Set Heart In Slot Back"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_BACK],
              },
            ];
          }}
        />
        <Button
          title="Set Heart In Slot Back Secondary"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_BACK_SECONDARY],
              },
            ];
          }}
        />
        <Button
          title="Set Heart In Slot Central"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_CENTRAL],
              },
            ];
          }}
        />
        <Button
          title="Set Heart In Slot Forward"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_FORWARD],
              },
            ];
          }}
        />
        <Button
          title="Set Heart In Slot Forward Secondary"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_FORWARD_SECONDARY],
              },
            ];
          }}
        />
        <Button
          title="Set Heart In Slot Overflow"
          style={styles.button}
          onPress={() => {
            player.nowPlayingActions = [
              {
                action: 'FAVORITE_ACTION',
                iconName: 'heart',
                displayName: 'Favorite',
                slots: [NowPlayingActionSlot.SLOT_OVERFLOW],
              },
            ];
          }}
        />
        {showNowPlaying && (
          <Text style={styles.centerText}>
            Go to the lockscreen or expand the notification center to see the expo-video
            notification 🚀 Remember that this feature is not supported in iOS Simulator.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
