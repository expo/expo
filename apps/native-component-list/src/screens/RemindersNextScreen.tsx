import { StackScreenProps } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import { ExpoCalendar, ExpoCalendarReminder } from 'expo-calendar/next';
import React, { useState, useEffect } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

type RowProps = {
  reminder: ExpoCalendarReminder;
  getReminder: (reminder: ExpoCalendarReminder) => void;
  updateReminder: (reminder: ExpoCalendarReminder) => void;
  deleteReminder: (reminder: ExpoCalendarReminder) => void;
};

const ReminderRow = ({ reminder, getReminder, updateReminder, deleteReminder }: RowProps) => (
  <View style={styles.reminderRow}>
    <Text style={styles.reminderName}>{reminder.title}</Text>
    <Text style={styles.reminderData}>{JSON.stringify(reminder)}</Text>
    <Button onPress={() => getReminder(reminder)} title="Get Reminder Using ID" />
    <Button onPress={() => updateReminder(reminder)} title="Update Reminder" />
    <Button onPress={() => deleteReminder(reminder)} title="Delete Reminder" />
  </View>
);

type Links = {
  Reminders: { calendar: ExpoCalendar };
};

type Props = StackScreenProps<Links, 'Reminders'>;

const RemindersScreen = ({ route }: Props) => {
  const [reminders, setReminders] = useState<ExpoCalendarReminder[]>([]);

  const calendar = route.params?.calendar;

  useEffect(() => {
    if (calendar) {
      findReminders(calendar);
    }
  }, [calendar]);

  const findReminders = async (calendar: ExpoCalendar) => {
    try {
      const reminders = await calendar.listReminders();
      setReminders(reminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminders([]);
    }
  };

  const addReminder = async () => {
    const { calendar } = route.params!;
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
      const createdReminder = calendar.createReminder(newReminder);
      console.log('newReminder', createdReminder);
      Alert.alert('Reminder saved successfully');
      findReminders(calendar);
    } catch (e: any) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  const getReminder = async (reminder: Calendar.Reminder) => {
    try {
      const newReminder = await Calendar.getReminderAsync(reminder.id!);
      Alert.alert('Reminder found using getReminderAsync', JSON.stringify(newReminder));
    } catch (e: any) {
      Alert.alert('Error finding reminder', e.message);
    }
  };

  const updateReminder = async (reminder: ExpoCalendarReminder) => {
    const { calendar } = route.params!;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const newReminder = {
      title: 'updated reminder',
      //   startDate: new Date(),
    };
    try {
      reminder.update(newReminder);
      Alert.alert('Reminder saved successfully');
      findReminders(calendar);
    } catch (e: any) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  const deleteReminder = async (reminder: ExpoCalendarReminder) => {
    try {
      const { calendar } = route.params!;
      reminder.delete();
      Alert.alert('Reminder deleted successfully');
      findReminders(calendar);
    } catch (e: any) {
      Alert.alert('Reminder not deleted successfully', e.message);
    }
  };

  if (!route.params?.calendar) {
    return <Text>Access this screen from the "Calendars" screen.</Text>;
  }

  if (reminders.length) {
    return (
      <ScrollView style={styles.container}>
        <Button onPress={addReminder} title="Add New Reminder" />
        {reminders.map((reminder) => (
          <ReminderRow
            reminder={reminder}
            key={reminder.id}
            getReminder={getReminder}
            updateReminder={updateReminder}
            deleteReminder={deleteReminder}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={{ padding: 10 }}>
      <Text>This calendar has no reminders.</Text>
      <Button onPress={addReminder} title="Add New Reminder" />
    </View>
  );
};

export default RemindersScreen;

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
