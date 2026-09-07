import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { EventEmitter, EventSubscription } from 'fbemitter';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import usePermissions from '../../utilities/usePermissions';

const STORAGE_KEY = 'expo-motion-activity-log';
const MOTION_ACTIVITY_TASK = 'motion-activity-updates';
const MAX_LOG_ENTRIES = 50;

const activityEventsEmitter = new EventEmitter();

type LogEntry = {
  receivedAt: string;
  activities: Location.MotionActivityObject['activities'];
};

export default function BackgroundMotionActivityScreen() {
  const [permission] = usePermissions(Location.requestMotionActivityPermissionsAsync);

  if (!permission) {
    return (
      <Text style={styles.errorText}>
        Motion & Fitness permission is required in order to use this feature. You can manually
        enable it at any time in the Settings app.
      </Text>
    );
  }

  return <BackgroundMotionActivityView />;
}

function BackgroundMotionActivityView() {
  const [isTracking, setIsTracking] = React.useState(false);
  const [log, setLog] = React.useState<LogEntry[]>([]);

  const onFocus = React.useCallback(() => {
    let isMounted = true;
    let subscription: EventSubscription | null = null;

    (async () => {
      const tracking = await Location.hasStartedMotionActivityUpdatesAsync(MOTION_ACTIVITY_TASK);
      const savedLog = await getSavedLog();

      subscription = activityEventsEmitter.addListener('update', (nextLog: LogEntry[]) => {
        if (isMounted) setLog(nextLog);
      });

      if (!isMounted) return;
      setIsTracking(tracking);
      setLog(savedLog);
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  useFocusEffect(onFocus);

  const toggleTracking = React.useCallback(async () => {
    if (isTracking) {
      await Location.stopMotionActivityUpdatesAsync(MOTION_ACTIVITY_TASK);
      setIsTracking(false);
      return;
    }

    await AsyncStorage.removeItem(STORAGE_KEY);
    setLog([]);
    await Location.startMotionActivityUpdatesAsync(MOTION_ACTIVITY_TASK, {
      foregroundService: {
        notificationTitle: 'expo-location-demo',
        notificationBody: 'Background motion activity is running...',
        notificationColor: Colors.tintColor,
      },
    });
    setIsTracking(true);
    alert(
      'Send the app to the background (or kill it on Android) and move around. Reopen the app ' +
        'to see whether updates were logged with a timestamp from while it was away.'
    );
  }, [isTracking]);

  return (
    <View style={styles.screen}>
      <Button
        title={isTracking ? 'Stop tracking' : 'Start tracking'}
        style={styles.button}
        onPress={toggleTracking}
      />
      <ScrollView style={styles.log}>
        {log.length === 0 && <Text style={styles.text}>No motion activity received yet.</Text>}
        {log.map((entry, index) => (
          <Text key={index} style={styles.text}>
            {entry.receivedAt} — {describeActivities(entry.activities)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

function describeActivities(activities: LogEntry['activities']) {
  const detected = Object.entries(activities)
    .filter(([, state]) => state.detected)
    .map(([type, state]) => `${type} (${Location.MotionActivityConfidence[state.confidence]})`);

  return detected.length > 0 ? detected.join(', ') : 'none detected';
}

async function getSavedLog(): Promise<LogEntry[]> {
  try {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

BackgroundMotionActivityScreen.navigationOptions = {
  title: 'Background motion activity',
};

TaskManager.defineTask(MOTION_ACTIVITY_TASK, async ({ data, error }: any) => {
  if (error) {
    console.log('Motion activity task error:', error);
    return;
  }

  const log = await getSavedLog();
  log.push({
    receivedAt: new Date().toISOString(),
    activities: data.activity.activities,
  });

  const trimmedLog = log.slice(-MAX_LOG_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLog));

  activityEventsEmitter.emit('update', trimmedLog);
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 10,
  },
  button: {
    marginBottom: 10,
  },
  log: {
    flex: 1,
  },
  text: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.7)',
    margin: 20,
  },
});
