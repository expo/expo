import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import format from 'date-format';
import {
  registerTaskAsync,
  unregisterTaskAsync,
  getStatusAsync,
  BackgroundTaskStatus,
} from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import useAppState from '../utilities/useAppState';

const BACKGROUND_TASK_IDENTIFIER = 'background-task';
const LAST_TASK_DATE_KEY = 'background-task-date';
export default function BackgroundTaskScreen() {
  const [isRegistered, setIsRegistered] = React.useState<boolean>(false);
  const [fetchDate, setFetchDate] = React.useState<Date | null>(null);
  const [status, setStatus] = React.useState<BackgroundTaskStatus | null>(null);
  const appState = useAppState(null);

  React.useEffect(() => {
    if (appState === 'active') {
      refreshLastFetchDateAsync();
    }
  }, [appState]);

  const onFocus = React.useCallback(() => {
    refreshLastFetchDateAsync();
    checkStatusAsync();
  }, []);
  useFocusEffect(onFocus);

  const refreshLastFetchDateAsync = async () => {
    const lastFetchDateStr = await AsyncStorage.getItem(LAST_TASK_DATE_KEY);
    if (lastFetchDateStr) {
      setFetchDate(new Date(+lastFetchDateStr));
    }
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    setIsRegistered(isRegistered);
  };

  const checkStatusAsync = async () => {
    const status = await getStatusAsync();
    console.log({ status, isRegistered });
    setStatus(status);
    await refreshLastFetchDateAsync();
  };

  const toggle = async () => {
    console.log({ isRegistered });
    if (isRegistered) {
      console.log('unregister');
      await unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
    } else {
      console.log('register');
      await registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
        minimumInterval: 60, // 1 minute
      });
    }
    setIsRegistered(!isRegistered);
  };

  const renderText = () => {
    if (!fetchDate) {
      return <Text>There was no Background Task call yet.</Text>;
    }
    return (
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Text>Last background task was invoked at:</Text>
        <Text style={styles.boldText}>{format('yyyy-MM-dd hh:mm:ss:SSS', fetchDate)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background Task Service:{' '}
          <Text style={styles.boldText}>{status ? BackgroundTaskStatus[status] : null}</Text>
        </Text>
      </View>
      <View style={styles.textContainer}>{renderText()}</View>
      <Button
        buttonStyle={styles.button}
        disabled={status === BackgroundTaskStatus.Restricted}
        title={isRegistered ? 'Cancel Background Task' : 'Schedule Background Task'}
        onPress={toggle}
      />
      <Button
        buttonStyle={styles.button}
        title="Check Background Task Status"
        onPress={checkStatusAsync}
      />
    </View>
  );
}

BackgroundTaskScreen.navigationOptions = {
  title: 'Background Task',
};

console.log('App: Registering background task');

// Register / create the task so that it is available also when the background task screen is not open
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
  console.log('TASK RUNNING', BACKGROUND_TASK_IDENTIFIER, 'setting', {
    key: LAST_TASK_DATE_KEY,
    value: Date.now().toString(),
  });
  await AsyncStorage.setItem(LAST_TASK_DATE_KEY, Date.now().toString());
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    marginVertical: 5,
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
});
