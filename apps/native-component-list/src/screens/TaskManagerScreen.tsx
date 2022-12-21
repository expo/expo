import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

export default function TaskManagerScreen(props: {
  navigation: StackNavigationProp<{
    BackgroundLocation: undefined;
    Geofencing: undefined;
    BackgroundFetch: undefined;
  }>;
}) {
  const [tasks, setTasks] = React.useState<TaskManager.TaskManagerTask[]>([]);

  const updateRegisteredTasks = async () => {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    setTasks(tasks);
  };

  const onFocus = React.useCallback(() => {
    let isActive = true;
    TaskManager.getRegisteredTasksAsync().then((tasks) => {
      if (isActive) setTasks(tasks);
    });
    return () => (isActive = false);
  }, [setTasks]);

  useFocusEffect(onFocus);

  const unregisterTask = async (taskName: string) => {
    await TaskManager.unregisterTaskAsync(taskName);
    await updateRegisteredTasks();
  };

  const unregisterAllTasks = async () => {
    await TaskManager.unregisterAllTasksAsync();
    await updateRegisteredTasks();
  };

  const renderButtons = () => {
    const buttons = tasks.map(({ taskName }) => {
      return (
        <Button
          key={taskName}
          style={styles.button}
          title={`Unregister '${taskName}'`}
          onPress={() => unregisterTask(taskName)}
        />
      );
    });

    return (
      <View style={styles.buttons}>
        {buttons}
        {tasks!.length > 0 && (
          <Button
            style={styles.button}
            buttonStyle={{ backgroundColor: 'red' }}
            title="Unregister all tasks"
            onPress={unregisterAllTasks}
          />
        )}
        {renderNavigationButtons()}
      </View>
    );
  };

  const renderNavigationButtons = () => {
    return (
      <View>
        <Text>
          Note: this screen may not work properly for you, work is needed to investigate further and
          improve it
        </Text>
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to background location screen"
          onPress={() => props.navigation.navigate('BackgroundLocation')}
        />
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to geofencing screen"
          onPress={() => props.navigation.navigate('Geofencing')}
        />
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to background fetch screen"
          onPress={() => props.navigation.navigate('BackgroundFetch')}
        />
      </View>
    );
  };

  if (!tasks) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText>Registered tasks</HeadingText>
      <MonoText>{JSON.stringify(tasks, null, 2)}</MonoText>
      {renderButtons()}
    </ScrollView>
  );
}

TaskManagerScreen.navigationOptions = {
  title: 'TaskManager',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 10,
  },
  buttons: {
    padding: 10,
  },
  button: {
    marginVertical: 10,
  },
});
