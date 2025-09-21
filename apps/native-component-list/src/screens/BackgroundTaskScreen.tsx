import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import format from 'date-format';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import useAppState from '../utilities/useAppState';

const BACKGROUND_TASK_IDENTIFIER = 'background-task';
const LAST_TASK_DATE_KEY = 'background-task-date';
const TRY_TRIGGER_TASK_EXPIRY = 'try-trigger-task-expiry';
const EXPIRY_TRIGGERED = 'expiry-triggered';

export default function BackgroundTaskScreen() {
  const [isRegistered, setIsRegistered] = React.useState<boolean>(false);
  const [lastRunDate, setLastRunDate] = React.useState<Date | null>(null);
  const [willTryTriggerTaskExpiry, setWillTryTriggerTaskExpiry] = React.useState<boolean>(false);
  const [expiryWasTriggered, setExpiryWasTriggered] = React.useState<string>('');
  const [status, setStatus] = React.useState<BackgroundTask.BackgroundTaskStatus | null>(null);
  const appState = useAppState(null);

  React.useEffect(() => {
    if (appState === 'active') {
      refreshLastRunDateAsync();
    }
    AsyncStorage.getItem(TRY_TRIGGER_TASK_EXPIRY).then((value) => {
      console.log('Should try trigger expiry:', value);
      setWillTryTriggerTaskExpiry(!!value);
    });
  }, [appState]);

  const onFocus = React.useCallback(() => {
    refreshLastRunDateAsync();
    checkStatusAsync();
  }, []);
  useFocusEffect(onFocus);

  useEffect(
    () =>
      BackgroundTask.addExpirationListener(() => {
        // Mark as expoired and refresh the last run date when tasks expire
        AsyncStorage.setItem(EXPIRY_TRIGGERED, Date.now().toString());
        refreshLastRunDateAsync();
      }).remove,
    []
  );

  const refreshLastRunDateAsync = async () => {
    const lastRunDateStr = await AsyncStorage.getItem(LAST_TASK_DATE_KEY);
    if (lastRunDateStr) {
      setLastRunDate(new Date(+lastRunDateStr));
    }
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    setIsRegistered(isRegistered);
    const didTriggerExpiry = await AsyncStorage.getItem(EXPIRY_TRIGGERED);
    setExpiryWasTriggered(didTriggerExpiry ?? '');
  };

  const checkStatusAsync = async () => {
    const status = await BackgroundTask.getStatusAsync();
    setStatus(status);
    await refreshLastRunDateAsync();
  };

  const toggle = async () => {
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
    } else {
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
        minimumInterval: 15, // 15 minutes
      });
    }
    setIsRegistered(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER));
  };

  const renderText = () => {
    if (!lastRunDate) {
      return <Text>There was no Background Task call yet.</Text>;
    }
    return (
      <View style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Text>Last background task was invoked at:</Text>
        <Text style={styles.boldText}>{format('yyyy-MM-dd hh:mm:ss:SSS', lastRunDate)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background Task Service:
          <Text style={styles.boldText}>
            {status ? BackgroundTask.BackgroundTaskStatus[status] : null}
          </Text>
        </Text>
      </View>
      <View style={styles.textContainer}>{renderText()}</View>
      <Button
        buttonStyle={styles.button}
        disabled={status === BackgroundTask.BackgroundTaskStatus.Restricted}
        title={isRegistered ? 'Cancel Background Task' : 'Schedule Background Task'}
        onPress={toggle}
      />
      <Button
        buttonStyle={styles.button}
        title="Check Background Task Status"
        onPress={checkStatusAsync}
      />
      {Platform.OS === 'ios' ? (
        <View style={styles.textContainer}>
          <Text style={{ textAlign: 'center' }}>
            Try trigger expiry handler on next run (loops 1000 times waiting 30s each)
          </Text>
          <Button
            buttonStyle={styles.button}
            title={
              willTryTriggerTaskExpiry ? 'Cancel trigger task expiry' : 'Try Trigger Task Expiry'
            }
            onPress={async () => {
              setWillTryTriggerTaskExpiry((p) => !p);
              await AsyncStorage.removeItem(EXPIRY_TRIGGERED);
              if (willTryTriggerTaskExpiry) {
                await AsyncStorage.removeItem(TRY_TRIGGER_TASK_EXPIRY);
              } else {
                await AsyncStorage.setItem(TRY_TRIGGER_TASK_EXPIRY, 'true');
              }
            }}
          />
          <Text style={{ textAlign: 'center' }}>Expiry was last trigger at:</Text>
          {expiryWasTriggered ? (
            <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>
              {format('yyyy-MM-dd hh:mm:ss:SSS', new Date(+expiryWasTriggered))}
            </Text>
          ) : (
            <Text style={{ textAlign: 'center' }}>Never</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

BackgroundTaskScreen.navigationOptions = {
  title: 'Background Task',
};

console.log('App: Defining background task');

// Register / create the task so that it is available also when the background task screen is not open
TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
  console.log('TASK RUNNING', BACKGROUND_TASK_IDENTIFIER, 'setting', {
    key: LAST_TASK_DATE_KEY,
    value: Date.now().toString(),
  });
  try {
    await AsyncStorage.setItem(LAST_TASK_DATE_KEY, Date.now().toString());
    // Now let's try to get the expiry handler to trigger
    // Let's try to loop 1000 times waiting 30 seconds each loop iteration
    const shouldTryTriggerExpiry = await AsyncStorage.getItem(TRY_TRIGGER_TASK_EXPIRY);
    if (shouldTryTriggerExpiry === 'true') {
      await AsyncStorage.removeItem(TRY_TRIGGER_TASK_EXPIRY);
      for (let i = 0; i < 1000; i++) {
        console.log(`Waiting for the expiry handler to trigger for ${i * 30} seconds...`);
        const promise = new Promise((resolve) => setTimeout(resolve, 30000));
        await promise;
      }
    }
  } catch (error) {
    console.error('Failed to save the last run date', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }

  return BackgroundTask.BackgroundTaskResult.Success;
});

// We're defining an unused, additional task to verify that the task manager is working correctly
// - not running this task when we trigger the background task worker for testing
TaskManager.defineTask('my-special-task', async () => {
  console.log('TASK RUNNING', 'my-special-task - SHOULD NOT HAPPEN');
  return BackgroundTask.BackgroundTaskResult.Success;
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
