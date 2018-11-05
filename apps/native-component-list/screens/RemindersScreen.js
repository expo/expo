import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'expo';

class ReminderRow extends React.Component {
  render() {
    const { reminder } = this.props;
    return (
      <View style={styles.reminderRow}>
        <Text style={styles.reminderName}>{reminder.title}</Text>
        <Text style={styles.reminderData}>{JSON.stringify(reminder)}</Text>
        <Button onPress={() => this.props.getReminder(reminder)} title="Get Reminder Using ID" />
        <Button onPress={() => this.props.updateReminder(reminder)} title="Update Reminder" />
        <Button onPress={() => this.props.deleteReminder(reminder.id)} title="Delete Reminder" />
      </View>
    );
  }
}

export default class RemindersScreen extends React.Component {
  static navigationOptions = {
    title: 'Reminders',
  };

  state = {
    reminders: [],
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    const { id } = params.calendar;
    if (id) {
      this._findReminders(id);
    }
  }

  _findReminders = async id => {
    const reminders = await Calendar.getRemindersAsync([id]);
    this.setState({ reminders });
  };

  _addReminder = async () => {
    const { calendar } = this.props.navigation.state.params;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const timeInOneHour = new Date();
    timeInOneHour.setHours(timeInOneHour.getHours() + 1);
    const newReminder = {
      title: 'do something cool w/ expo',
      location: '420 Florence St',
      startDate: new Date(),
      dueDate: timeInOneHour,
      notes: 'where do these notes show up',
    };
    try {
      await Calendar.createReminderAsync(calendar.id, newReminder);
      Alert.alert('Reminder saved successfully');
      this._findReminders(calendar.id);
    } catch (e) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  _getReminder = async reminder => {
    try {
      const newReminder = await Calendar.getReminderAsync(reminder.id, {
        futureReminders: false,
        instanceStartDate: reminder.startDate,
      });
      Alert.alert('Reminder found using getReminderAsync', JSON.stringify(newReminder));
    } catch (e) {
      Alert.alert('Error finding reminder', e.message);
    }
  };

  _updateReminder = async reminder => {
    const { calendar } = this.props.navigation.state.params;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const newReminder = {
      title: 'updated reminder',
      startDate: new Date(),
    };
    try {
      await Calendar.updateReminderAsync(reminder.id, newReminder);
      Alert.alert('Reminder saved successfully');
      this._findReminders(calendar.id);
    } catch (e) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  _deleteReminder = async reminderId => {
    try {
      const { calendar } = this.props.navigation.state.params;
      await Calendar.deleteReminderAsync(reminderId);
      Alert.alert('Reminder deleted successfully');
      this._findReminders(calendar.id);
    } catch (e) {
      Alert.alert('Reminder not deleted successfully', e.message);
    }
  };

  render() {
    if (this.state.reminders.length) {
      return (
        <ScrollView style={styles.container}>
          <Button onPress={this._addReminder} title="Add New Reminder" />
          {this.state.reminders.map(reminder => (
            <ReminderRow
              reminder={reminder}
              key={reminder.id}
              getReminder={this._getReminder}
              updateReminder={this._updateReminder}
              deleteReminder={this._deleteReminder}
            />
          ))}
        </ScrollView>
      );
    }

    return (
      <View style={{ padding: 10 }}>
        <Text>This calendar has no reminders.</Text>
        <Button onPress={this._addReminder} title="Add New Reminder" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    flex: 1,
  },
  reminderRow: {
    marginBottom: 12,
  },
  reminderName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reminderData: {},
});
