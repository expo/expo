import React from 'react';
import { TaskManager } from 'expo';
import { ScrollView, StyleSheet, View } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import HeadingText from '../components/HeadingText';

export default class TaskManagerScreen extends React.Component {
  static navigationOptions = {
    title: 'TaskManager',
  };

  state = {
    tasks: null,
  };

  componentDidMount() {
    this.updateRegisteredTasks();
  }

  updateRegisteredTasks = async () => {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    this.setState({ tasks });
  };

  unregisterTask = async taskName => {
    await TaskManager.unregisterTaskAsync(taskName);
    await this.updateRegisteredTasks();
  };

  unregisterAllTasks = async () => {
    await TaskManager.unregisterAllTasksAsync();
    await this.updateRegisteredTasks();
  };

  renderButtons() {
    const { tasks } = this.state;
    const taskNames = Object.keys(tasks);
    const buttons = taskNames.map(taskName => {
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
        { taskNames.length > 0 &&
          <Button
            style={styles.button}
            buttonStyle={{ backgroundColor: 'red' }}
            title="Unregister all tasks"
            onPress={this.unregisterAllTasks}
          />
        }
        {this.renderNavigationButtons()}
      </View>
    );
  }

  renderNavigationButtons() {
    return (
      <Button
        style={styles.button}
        buttonStyle={{ backgroundColor: 'green' }}
        title="Go to background location screen"
        onPress={() => this.props.navigation.navigate('BackgroundLocationMap')}
      />
    );
  }

  render() {
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
}

const styles = StyleSheet.create({
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
