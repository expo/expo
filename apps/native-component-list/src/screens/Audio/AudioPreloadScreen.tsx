import {
  preload,
  getPreloadedSources,
  clearAllPreloadedSources,
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioPlayer,
  AudioSource,
  AudioStatus,
} from 'expo-audio';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import ListButton from '../../components/ListButton';
import Colors from '../../constants/Colors';

export const sfx1: AudioSource = {
  uri: 'https://cdn.freesound.org/previews/370/370182_6430986-hq.mp3',
};

export const sfx2: AudioSource = {
  uri: 'https://cdn.freesound.org/previews/401/401542_2331641-hq.mp3',
};

export default function AudioPreloadScreen(props: any) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Audio Preloading',
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Sound Effects</HeadingText>
      <Text style={styles.hint}>
        Both sounds were preloaded in module scope. Tap the buttons to play — they should start
        near-instantly.
      </Text>
      <SoundEffectButtons />

      <HeadingText>Preload Cache</HeadingText>
      <PreloadCacheInfo />

      <HeadingText>Preloaded Player</HeadingText>
      <Text style={styles.hint}>
        This player uses a preloaded source. Try replacing to swap between the two preloaded tracks.
      </Text>
      <PreloadedPlayer />
    </ScrollView>
  );
}

function SoundEffectButtons() {
  const player1 = useAudioPlayer(sfx1, { keepAudioSessionActive: true });
  const player2 = useAudioPlayer(sfx2, { keepAudioSessionActive: true });
  const status1 = useAudioPlayerStatus(player1);
  const status2 = useAudioPlayerStatus(player2);

  const playSfx = (player: AudioPlayer, status: AudioStatus) => {
    if (status.playing) {
      player.seekTo(0);
    } else {
      if (status.didJustFinish || status.currentTime > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <View style={styles.sfxRow}>
      <SfxButton
        label="Sound 1"
        isLoaded={status1.isLoaded}
        onPress={() => playSfx(player1, status1)}
      />
      <SfxButton
        label="Sound 2"
        isLoaded={status2.isLoaded}
        onPress={() => playSfx(player2, status2)}
      />
    </View>
  );
}

function SfxButton({
  label,
  isLoaded,
  onPress,
}: {
  label: string;
  isLoaded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.sfxButton, pressed && styles.sfxButtonPressed]}
      onPress={onPress}>
      <Text style={styles.sfxButtonText}>{label}</Text>
      <Text style={styles.sfxButtonStatus}>{isLoaded ? 'Ready' : 'Loading...'}</Text>
    </Pressable>
  );
}

function PreloadCacheInfo() {
  const [sources, setSources] = React.useState<string[]>([]);

  const refresh = async () => setSources(await getPreloadedSources());

  return (
    <View>
      <Text style={styles.hint}>
        Preloaded sources are consumed when a player is created with a matching URL. Use the buttons
        below to preload, inspect, and clear the cache.
      </Text>
      <ListButton
        title="Preload Both"
        onPress={async () => {
          await preload(sfx1);
          await preload(sfx2);
          refresh();
        }}
      />
      <ListButton title="Query Cache" onPress={refresh} />
      <Text style={styles.hint}>
        {sources.length === 0 ? 'Cache is empty.' : `${sources.length} source(s) in cache:`}
      </Text>
      {sources.map((uri) => (
        <Text key={uri} style={styles.cacheUri} numberOfLines={1}>
          {uri}
        </Text>
      ))}
      <ListButton
        title="Clear Cache"
        onPress={async () => {
          await clearAllPreloadedSources();
          refresh();
        }}
      />
    </View>
  );
}

function PreloadedPlayer() {
  const player = useAudioPlayer(sfx1);
  const status = useAudioPlayerStatus(player);
  const [currentSource, setCurrentSource] = React.useState<1 | 2>(1);

  const handleReplace = () => {
    if (currentSource === 1) {
      player.replace(sfx2);
      setCurrentSource(2);
    } else {
      player.replace(sfx1);
      setCurrentSource(1);
    }
  };

  return (
    <View>
      <Text style={styles.hint}>Current: Sound {currentSource}</Text>
      <Text style={styles.hint}>
        {status.isLoaded ? `Loaded — ${Math.round(status.duration)}s` : 'Loading...'}
        {status.playing ? ' — Playing' : ''}
      </Text>
      <View style={styles.buttonRow}>
        <ListButton
          title={status.playing ? 'Pause' : 'Play'}
          onPress={() => {
            if (status.playing) {
              player.pause();
            } else {
              if (status.didJustFinish) player.seekTo(0);
              player.play();
            }
          }}
        />
        <ListButton
          title={`Switch to Sound ${currentSource === 1 ? 2 : 1}`}
          onPress={handleReplace}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  hint: {
    marginVertical: 4,
    fontSize: 13,
    color: '#666',
  },
  sfxRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  sfxButton: {
    flex: 1,
    backgroundColor: Colors.tintColor,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sfxButtonPressed: {
    opacity: 0.7,
  },
  sfxButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sfxButtonStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  cacheUri: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    marginLeft: 8,
    marginVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
