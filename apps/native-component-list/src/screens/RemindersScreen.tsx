import { StackScreenProps } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar/legacy';
import React from 'react';
import { Alert, Button, ScrollView, StyleSheet, View } from 'react-native';

import { BodyText } from '../components/BodyText';

interface RowProps {
  reminder: Calendar.Reminder;
  getReminder: (reminder: Calendar.Reminder) => void;
  updateReminder: (reminder: Calendar.Reminder) => void;
  deleteReminder: (remidnerId: string) => void;
}

const ReminderRow: React.FunctionComponent<RowProps> = ({
  reminder,
  getReminder,
  updateReminder,
  deleteReminder,
}) => (
  <View style={styles.reminderRow}>
    <BodyText style={styles.reminderName}>{reminder.title}</BodyText>
    <BodyText style={styles.reminderData}>{JSON.stringify(reminder)}</BodyText>
    <Button onPress={() => getReminder(reminder)} title="Get Reminder Using ID" />
    <Button onPress={() => updateReminder(reminder)} title="Update Reminder" />
    <Button onPress={() => deleteReminder(reminder.id!)} title="Delete Reminder" />
  </View>
);

interface State {
  reminders: Calendar.Reminder[];
  calendar: Calendar.Calendar | null;
}

// Route params must stay serializable, so this screen receives the id and refetches the calendar.
type Links = {
  Reminders: { calendarId: string };
};

type Props = StackScreenProps<Links, 'Reminders'>;

export default class RemindersScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Reminders',
  };

  readonly state: State = {
    reminders: [],
    calendar: null,
  };

  componentDidMount() {
    const calendarId = this.props.route.params?.calendarId;
    if (calendarId) {
      this._loadCalendar(calendarId);
      this._findReminders(calendarId);
    }
  }

  _loadCalendar = async (calendarId: string) => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
    this.setState({ calendar: calendars.find(({ id }) => id === calendarId) ?? null });
  };

  _findReminders = async (id: string) => {
    const reminders = await Calendar.getRemindersAsync([id], null, new Date(), new Date());
    this.setState({ reminders });
  };

  _addReminder = async () => {
    const { calendar } = this.state;
    if (!calendar) {
      return;
    }
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
      await Calendar.createReminderAsync(calendar.id!, newReminder);
      Alert.alert('Reminder saved successfully');
      this._findReminders(calendar.id!);
    } catch (e: any) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  _getReminder = async (reminder: Calendar.Reminder) => {
    try {
      const newReminder = await Calendar.getReminderAsync(reminder.id!);
      Alert.alert('Reminder found using getReminderAsync', JSON.stringify(newReminder));
    } catch (e: any) {
      Alert.alert('Error finding reminder', e.message);
    }
  };

  _updateReminder = async (reminder: Calendar.Reminder) => {
    const { calendar } = this.state;
    if (!calendar) {
      return;
    }
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const newReminder = {
      title: 'updated reminder',
      startDate: new Date(),
    };
    try {
      await Calendar.updateReminderAsync(reminder.id!, newReminder);
      Alert.alert('Reminder saved successfully');
      this._findReminders(calendar.id!);
    } catch (e: any) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  _deleteReminder = async (reminderId: string) => {
    try {
      const { calendarId } = this.props.route.params!;
      await Calendar.deleteReminderAsync(reminderId);
      Alert.alert('Reminder deleted successfully');
      this._findReminders(calendarId);
    } catch (e: any) {
      Alert.alert('Reminder not deleted successfully', e.message);
    }
  };

  render() {
    if (!this.props.route.params?.calendarId) {
      return <BodyText>Access this screen from the "Calendars" screen.</BodyText>;
    }
    if (this.state.reminders.length) {
      return (
        <ScrollView style={styles.container}>
          <Button onPress={this._addReminder} title="Add New Reminder" />
          {this.state.reminders.map((reminder) => (
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
        <BodyText>This calendar has no reminders.</BodyText>
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
