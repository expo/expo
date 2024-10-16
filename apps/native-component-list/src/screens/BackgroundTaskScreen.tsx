import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import format from 'date-format';
import * as BackgroundTask from 'expo-background-task';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import Button from '../components/Button';
import useAppState from '../utilities/useAppState';

const BACKGROUND_TASK_IDENTIFIER = 'background-task';
const LAST_TASK_DATE_KEY = 'background-task-date';

export const RegisterBackgroundTask = () => {
  console.log('App: Registering background task');
  // Register / create the task so that it is available also when the background task screen is not open
  BackgroundTask.createTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log('TASK RUNNING', BACKGROUND_TASK_IDENTIFIER, 'setting', {
      key: LAST_TASK_DATE_KEY,
      value: Date.now().toString(),
    });
    await AsyncStorage.setItem(LAST_TASK_DATE_KEY, Date.now().toString());
  });
};

export default function BackgroundTaskScreen() {
  const [fetchDate, setFetchDate] = React.useState<Date | null>(null);
  const [isWorkerRunning, setIsWorkerRunning] = React.useState<boolean>(false);
  const [isTaskScheduled, setIsTaskScheduled] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<BackgroundTask.BackgroundTaskStatus | null>(null);
  const [log, setLog] = React.useState<BackgroundTask.BackgroundTaskRunInfo[] | undefined>([]);
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
  };

  const checkStatusAsync = async () => {
    const status = await BackgroundTask.getStatusAsync();
    const isRegistered = await BackgroundTask.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    const isScheduled = await BackgroundTask.isTaskScheduled(BACKGROUND_TASK_IDENTIFIER);
    const isWorkerRunning = await BackgroundTask.isWorkerRunning();
    const taskLog = await BackgroundTask.getTaskInfoLog(BACKGROUND_TASK_IDENTIFIER);
    console.log({ status, isScheduled, isRegistered, isWorkerRunning });
    setStatus(status);
    setIsWorkerRunning(isWorkerRunning);
    setIsTaskScheduled(isScheduled);
    setLog(taskLog);
    await refreshLastFetchDateAsync();
  };

  // Update status after work has been done
  useEffect(() => {
    return BackgroundTask.addOnWorkListener(checkStatusAsync).remove;
  });

  const scheduleTaskAsync = async () => {
    await BackgroundTask.scheduleTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      // Options - like intervals, type (once or periodic)
      type: BackgroundTask.BackgroundTaskType.Periodic,
      intervalMinutes: 15,
    });
    checkStatusAsync();
  };

  const cancelTaskAsync = async () => {
    await BackgroundTask.cancelTaskAsync(BACKGROUND_TASK_IDENTIFIER);
    checkStatusAsync();
  };

  const cleanTasks = async () => {
    await BackgroundTask.cleanScheduledTasks();
    checkStatusAsync();
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

  const renderLog = () => {
    return (
      <View style={{ maxHeight: 150 }}>
        <Text>Task log:</Text>
        <ScrollView style={{ borderColor: 'gray', borderWidth: 1, padding: 4 }}>
          {log?.map((logItem, index) => (
            <Text key={index}>
              {format('yyyy-MM-dd hh:mm:ss:SSS', new Date(logItem.date))} -{' '}
              {BackgroundTask.BackgroundTaskInfoStatus[logItem.status]}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  const toggle = async () => {
    if (!isTaskScheduled) {
      await scheduleTaskAsync();
    } else {
      await cancelTaskAsync();
    }
    checkStatusAsync();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background Task Service:{' '}
          <Text style={styles.boldText}>
            {status ? BackgroundTask.BackgroundTaskStatus[status] : null}
          </Text>
        </Text>
        <Text>
          Task scheduled: <Text style={styles.boldText}>{isTaskScheduled ? 'true' : 'false'}</Text>
        </Text>
        <Text>
          Background Worker Status:{' '}
          <Text style={styles.boldText}>{isWorkerRunning ? 'RUNNING' : 'STOPPED'}</Text>
        </Text>
      </View>
      <View style={styles.textContainer}>{renderText()}</View>
      <Button
        buttonStyle={styles.button}
        disabled={status === BackgroundTask.BackgroundTaskStatus.Restricted}
        title={isTaskScheduled ? 'Cancel Background Task' : 'Schedule Background Task'}
        onPress={toggle}
      />
      <Button
        buttonStyle={styles.button}
        title="Check Background Task Status"
        onPress={checkStatusAsync}
      />
      <Button buttonStyle={styles.button} title="Clean Tasks" onPress={cleanTasks} />
      <View style={styles.textContainer}>{renderLog()}</View>
    </View>
  );
}

BackgroundTaskScreen.navigationOptions = {
  title: 'Background Task',
};

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
