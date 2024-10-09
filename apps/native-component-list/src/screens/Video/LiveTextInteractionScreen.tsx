import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { forBiggerBlazesSource } from './videoSources';
import { styles } from './videoStyles';
import TitledSwitch from '../../components/TitledSwitch';

export default function LiveTextInteractionScreen() {
  const [allowLiveTextInteraction, setAllowLiveTextInteraction] = useState(false);
  const player = useVideoPlayer(forBiggerBlazesSource, (player) => {
    player.loop = true;
    player.currentTime = 8;
    player.pause();
  });

  return (
    <View style={styles.contentContainer}>
      <VideoView
        player={player}
        style={styles.video}
        allowsVideoFrameAnalysis={allowLiveTextInteraction}
      />
      <ScrollView style={styles.controlsContainer}>
        <View style={styles.row}>
          <TitledSwitch
            title="Allow Live Text Interaction"
            value={allowLiveTextInteraction}
            setValue={setAllowLiveTextInteraction}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
      </ScrollView>
    </View>
  );
}
