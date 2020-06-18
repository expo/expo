import * as TaskManager from 'expo-task-manager';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NavigationEvents, NavigationScreenProps } from 'react-navigation';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

interface State {
  tasks?: TaskManager.RegisteredTask[];
}

export default class TaskManagerScreen extends React.Component<NavigationScreenProps, State> {
  static navigationOptions = {
    title: 'TaskManager',
  };

  readonly state: State = {};

  componentDidMount() {
    this.updateRegisteredTasks();
  }

  updateRegisteredTasks = async () => {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    this.setState({ tasks });
  };

  unregisterTask = async (taskName: string) => {
    await TaskManager.unregisterTaskAsync(taskName);
    await this.updateRegisteredTasks();
  };

  unregisterAllTasks = async () => {
    await TaskManager.unregisterAllTasksAsync();
    await this.updateRegisteredTasks();
  };

  renderButtons() {
    const { tasks } = this.state;
    const buttons = tasks!.map(({ taskName }) => {
      return (
        <Button
          key={taskName}
          style={styles.button}
          title={`Unregister '${taskName}'`}
          onPress={() => this.unregisterTask(taskName)}
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
            onPress={this.unregisterAllTasks}
          />
        )}
        {this.renderNavigationButtons()}
      </View>
    );
  }

  renderNavigationButtons() {
    return (
      <View>
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to background location screen"
          onPress={() => this.props.navigation.navigate('BackgroundLocationMap')}
        />
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to geofencing screen"
          onPress={() => this.props.navigation.navigate('Geofencing')}
        />
        <Button
          style={styles.button}
          buttonStyle={{ backgroundColor: 'green' }}
          title="Go to background fetch screen"
          onPress={() => this.props.navigation.navigate('BackgroundFetch')}
        />
      </View>
    );
  }

  renderContent() {
    const { tasks } = this.state;

    if (!tasks) {
      return null;
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <HeadingText>Registered tasks</HeadingText>
        <MonoText>{JSON.stringify(tasks, null, 2)}</MonoText>
        {this.renderButtons()}
      </ScrollView>
    );
  }

  render() {
    return (
      <View style={styles.screen}>
        <NavigationEvents onDidFocus={this.updateRegisteredTasks} />
        {this.renderContent()}
      </View>
    );
  }
}

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
