import { useAudioPlayer, useAudioPlayerStatus, AudioStatus } from 'expo-audio';
import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

const localSource = require('../../../assets/sounds/polonez.mp3');

type EventLogEntry = {
  id: number;
  timestamp: string;
  eventType: string;
  data: Record<string, unknown>;
  isHighlighted?: boolean;
};

export default function AudioEventsScreen(props: any) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Audio Events',
    });
  }, []);

  return (
    <View style={styles.container}>
      <AudioEvents />
    </View>
  );
}

function AudioEvents() {
  const player = useAudioPlayer(localSource);
  const status = useAudioPlayerStatus(player);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const eventIdRef = useRef(0);
  const scrollViewRef = useRef<FlatList>(null);
  const prevStatusRef = useRef<AudioStatus | null>(null);

  React.useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const changes: Record<string, unknown> = {};

    if (prevStatus) {
      if (prevStatus.playing !== status.playing) {
        changes.playing = status.playing;
      }
      if (prevStatus.playbackState !== status.playbackState) {
        changes.playbackState = status.playbackState;
      }
      if (prevStatus.didJustFinish !== status.didJustFinish) {
        changes.didJustFinish = status.didJustFinish;
      }
      if (prevStatus.isLoaded !== status.isLoaded) {
        changes.isLoaded = status.isLoaded;
      }
      if (prevStatus.isBuffering !== status.isBuffering) {
        changes.isBuffering = status.isBuffering;
      }
    }

    const hasChanges = Object.keys(changes).length > 0;
    const isDidJustFinish = status.didJustFinish;

    if (hasChanges || isDidJustFinish) {
      const entry: EventLogEntry = {
        id: eventIdRef.current++,
        timestamp: new Date().toISOString().slice(11, 23),
        eventType: 'playbackStatusUpdate',
        data: hasChanges ? changes : { didJustFinish: status.didJustFinish },
        isHighlighted: isDidJustFinish,
      };
      setEventLog((prev) => [...prev.slice(-49), entry]);
    }

    prevStatusRef.current = status;
  }, [status]);

  const clearLog = useCallback(() => {
    setEventLog([]);
    eventIdRef.current = 0;
  }, []);

  const seekToEnd = useCallback(() => {
    if (status.duration > 2) {
      player.seekTo(status.duration - 2);
    }
  }, [player, status.duration]);

  const seekToStart = useCallback(() => {
    player.seekTo(0);
  }, [player]);

  const renderLogEntry = ({ item }: { item: EventLogEntry }) => (
    <View style={[styles.logEntry, item.isHighlighted && styles.highlightedEntry]}>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
      <Text style={[styles.eventType, item.isHighlighted && styles.highlightedText]}>
        {item.eventType}
      </Text>
      <Text style={[styles.eventData, item.isHighlighted && styles.highlightedText]}>
        {JSON.stringify(item.data)}
      </Text>
    </View>
  );

  return (
    <View style={styles.testerContainer}>
      <HeadingText>Current Status</HeadingText>
      <View style={styles.statusContainer}>
        <StatusRow label="playing" value={status.playing} />
        <StatusRow label="playbackState" value={status.playbackState} />
        <StatusRow
          label="didJustFinish"
          value={status.didJustFinish}
          highlight={status.didJustFinish}
        />
        <StatusRow label="isLoaded" value={status.isLoaded} />
        <StatusRow label="currentTime" value={status.currentTime.toFixed(2)} />
        <StatusRow label="duration" value={status.duration.toFixed(2)} />
      </View>

      <HeadingText>Controls</HeadingText>
      <View style={{ gap: 10 }}>
        <View style={styles.controlsRow}>
          <Button title="Play" onPress={() => player.play()} />
          <Button title="Pause" onPress={() => player.pause()} />
          <Button title="Seek to Start" onPress={seekToStart} />
        </View>
        <View style={styles.controlsRow}>
          <Button title="Seek Near End (-2s)" onPress={seekToEnd} />
          <Button title="Clear Log" onPress={clearLog} />
        </View>
      </View>

      <HeadingText>Event Log (last 50)</HeadingText>
      <Text style={styles.hint}>
        Highlighted entries show when didJustFinish is true. It should only appear once per track
        completion.
      </Text>
      <FlatList
        ref={scrollViewRef}
        style={styles.logContainer}
        data={eventLog}
        renderItem={renderLogEntry}
        keyExtractor={(item) => item.id.toString()}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <Text style={styles.emptyLog}>No events yet. Play audio to start.</Text>
        }
      />
    </View>
  );
}

function StatusRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: unknown;
  highlight?: boolean;
}) {
  const displayValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}:</Text>
      <Text style={[styles.statusValue, highlight && styles.highlightedText]}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  testerContainer: {
    flex: 1,
    padding: 10,
  },
  statusContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLabel: {
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    color: '#666',
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 8,
  },
  highlightedEntry: {
    backgroundColor: '#2d4a3e',
  },
  timestamp: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
    width: 85,
  },
  eventType: {
    color: '#6bb3ff',
    fontSize: 11,
    fontFamily: 'monospace',
    width: 100,
  },
  eventData: {
    color: '#98c379',
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
  highlightedText: {
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptyLog: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
