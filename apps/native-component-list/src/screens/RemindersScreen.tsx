import { StackScreenProps } from '@react-navigation/stack';
import { usePermissions } from 'expo';
import * as Calendar from 'expo-calendar';
import React, { useState, useEffect } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

interface RowProps {
  reminder: Calendar.Reminder;
  getReminder: (reminder: Calendar.Reminder) => void;
  updateReminder: (reminder: Calendar.Reminder) => void;
  deleteReminder: (reminderId: string) => void;
}

const ReminderRow: React.FC<RowProps> = ({
  reminder,
  getReminder,
  updateReminder,
  deleteReminder,
}) => (
  <View style={styles.reminderRow}>
    <Text style={styles.reminderName}>{reminder.title}</Text>
    <Text style={styles.reminderData}>{JSON.stringify(reminder)}</Text>
    <Button onPress={() => getReminder(reminder)} title="Get Reminder Using ID" />
    <Button onPress={() => updateReminder(reminder)} title="Update Reminder" />
    <Button onPress={() => deleteReminder(reminder.id!)} title="Delete Reminder" />
  </View>
);

interface Links {
  Reminders: { calendar: Calendar.Calendar };
}

type Props = StackScreenProps<Links, 'Reminders'>;

const RemindersScreen: React.FC<Props> = ({ route }) => {
  const [reminders, setReminders] = useState<Calendar.Reminder[]>([]);

  useEffect(() => {
    if (route.params) {
      findReminders(route.params.calendar.id!);
    }
  }, [route.params]);

  const { request } = usePermissions(Calendar.permissions.readReminders);
  const findReminders = async (calendarId: string) => {
    const reminders = await Calendar.getRemindersAsync([calendarId], null, new Date(), new Date());
    setReminders(reminders);
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
      await Calendar.createReminderAsync(calendar.id!, newReminder);
      Alert.alert('Reminder saved successfully');
      findReminders(calendar.id!);
    } catch (e) {
      Alert.alert('Reminder not saved successfully', e.message);
    }
  };

  const handleGetReminder = async (reminder: Calendar.Reminder) => {
    try {
      const newReminder = await Calendar.getReminderAsync(reminder.id!);
      Alert.alert('Reminder found using getReminderAsync', JSON.stringify(newReminder));
    } catch (e) {
      Alert.alert('Error finding reminder', e.message);
    }
  };

  const handleUpdateReminder = async (reminder: Calendar.Reminder) => {
    const { calendar } = route.params!;
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
      Alert.alert('Reminder updated successfully');
      findReminders(calendar.id!);
    } catch (e) {
      Alert.alert('Reminder not updated successfully', e.message);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const { calendar } = route.params!;
      await Calendar.deleteReminderAsync(reminderId);
      Alert.alert('Reminder deleted successfully');
      findReminders(calendar.id!);
    } catch (e) {
      Alert.alert('Reminder not deleted successfully', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Button onPress={addReminder} title="Add New Reminder" />
      <Button onPress={async () => console.log(await request())} title="Check permissions" />
      {reminders.map((reminder) => (
        <ReminderRow
          key={reminder.id}
          reminder={reminder}
          getReminder={handleGetReminder}
          updateReminder={handleUpdateReminder}
          deleteReminder={handleDeleteReminder}
        />
      ))}
    </ScrollView>
  );
};

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

export default RemindersScreen;
