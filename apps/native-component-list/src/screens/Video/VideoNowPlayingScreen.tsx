import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useState } from 'react';
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
      player.replace(elephantsDreamSource);
      setCurrentSource(elephantsDreamSource);
    } else {
      player.replace(bigBuckBunnySource);
      setCurrentSource(bigBuckBunnySource);
    }
  }, [player, currentSource]);

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
