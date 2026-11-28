import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {
  addActivationErrorListener,
  addInterruptionListener,
  getAudioPolicy,
  holdSession,
  InterruptionMode,
  releaseSession,
  setAudioPolicyAsync,
} from 'expo-media-session';
import { AudioMixingMode, useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';
import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';

const HOLD_KEY = 'video-audio-session-screen';
const mixingModes: AudioMixingMode[] = ['mixWithOthers', 'duckOthers', 'auto', 'doNotMix'];
const interruptionModes: InterruptionMode[] = [
  'mixWithOthers',
  'duckOthers',
  'doNotMix',
  'doNotMixPersistent',
];

export default function VideoAudioSessionScreen() {
  const [manageAudioSession, setManageAudioSession] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mixingModeIndex, setMixingModeIndex] = useState(mixingModes.indexOf('auto'));
  const [interruptionMode, setInterruptionMode] = useState(() => getAudioPolicy().interruptionMode);
  const [isSessionHeld, setIsSessionHeld] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.manageAudioSession = manageAudioSession;
    player.showNowPlayingNotification = showNowPlaying;
    player.staysActiveInBackground = true;
    player.muted = isMuted;
  });

  const logEvent = useCallback((event: string) => {
    setEvents((events) => [`${new Date().toLocaleTimeString()} ${event}`, ...events].slice(0, 20));
  }, []);

  useEffect(() => {
    const initialPolicy = getAudioPolicy();
    const subscriptions = [
      addInterruptionListener((event) => logEvent(`interruption ${JSON.stringify(event)}`)),
      addActivationErrorListener((event) => logEvent(`activationError ${JSON.stringify(event)}`)),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      releaseSession(HOLD_KEY);
      setAudioPolicyAsync(initialPolicy);
    };
  }, [logEvent]);

  const applyInterruptionMode = useCallback(
    async (mode: InterruptionMode) => {
      try {
        await setAudioPolicyAsync({ interruptionMode: mode });
        logEvent(`policy interruptionMode: ${mode}`);
      } catch (error) {
        logEvent(`policy rejected: ${error}`);
      }
      setInterruptionMode(getAudioPolicy().interruptionMode);
    },
    [logEvent]
  );

  const toggleSessionHold = useCallback(() => {
    if (isSessionHeld) {
      releaseSession(HOLD_KEY);
    } else {
      holdSession(HOLD_KEY);
    }
    logEvent(isSessionHeld ? 'releaseSession' : 'holdSession');
    setIsSessionHeld(!isSessionHeld);
  }, [isSessionHeld, logEvent]);

  return (
    <View style={styles.contentContainer}>
      <VideoView player={player} style={styles.video} allowsPictureInPicture />
      <ScrollView style={styles.controlsContainer}>
        <View style={styles.row}>
          <Button style={styles.button} title="Play" onPress={() => player.play()} />
          <Button style={styles.button} title="Pause" onPress={() => player.pause()} />
        </View>

        <View style={styles.row}>
          <TitledSwitch
            title="manageAudioSession"
            value={manageAudioSession}
            setValue={(value) => {
              player.manageAudioSession = value;
              setManageAudioSession(value);
            }}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Now Playing"
            value={showNowPlaying}
            setValue={(value) => {
              player.showNowPlayingNotification = value;
              setShowNowPlaying(value);
            }}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Muted"
            value={isMuted}
            setValue={(value) => {
              player.muted = value;
              setIsMuted(value);
            }}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>

        <Text style={styles.switchTitle}>Player audioMixingMode</Text>
        <SegmentedControl
          values={mixingModes}
          selectedIndex={mixingModeIndex}
          onValueChange={(value) => {
            const mode = value as AudioMixingMode;
            player.audioMixingMode = mode;
            setMixingModeIndex(mixingModes.indexOf(mode));
          }}
          backgroundColor="#e5e5e5"
        />

        <Text style={[styles.switchTitle, { marginTop: 16 }]}>
          expo-media-session policy interruptionMode
        </Text>
        <SegmentedControl
          values={interruptionModes}
          selectedIndex={interruptionModes.indexOf(interruptionMode)}
          onValueChange={(value) => applyInterruptionMode(value as InterruptionMode)}
          backgroundColor="#e5e5e5"
        />
        <Button
          style={styles.button}
          title={isSessionHeld ? 'Release session' : 'Hold session'}
          onPress={toggleSessionHold}
        />

        <Text style={styles.centerText}>
          With manageAudioSession off, the player does not change the audio session. Conflicts are
          logged as warnings in the JS console.
        </Text>
        <Text style={[styles.switchTitle, { marginTop: 16 }]}>Events</Text>
        {events.map((event, index) => (
          <Text key={index} style={styles.centerText}>
            {event}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
