import type { StackNavigationProp } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

type StackNavigation = StackNavigationProp<{
  Reminders: { calendar: any };
  Events: { calendar: any };
}>;

const CalendarRow = (props: {
  navigation: StackNavigation;
  calendar: Calendar.Calendar;
  updateCalendar: (calendarId: string) => void;
  deleteCalendar: (calendar: any) => void;
}) => {
  const { calendar } = props;
  const calendarTypeName =
    calendar.entityType === Calendar.EntityTypes.REMINDER ? 'Reminders' : 'Events';
  return (
    <View style={styles.calendarRow}>
      <HeadingText>{calendar.title}</HeadingText>
      <MonoText>{JSON.stringify(calendar, null, 2)}</MonoText>
      <ListButton
        onPress={() => props.navigation.navigate(calendarTypeName, { calendar })}
        title={`View ${calendarTypeName}`}
      />
      <ListButton
        onPress={() => props.updateCalendar(calendar.id)}
        title="Update Calendar"
        disabled={!calendar.allowsModifications}
      />
      <ListButton
        onPress={() => props.deleteCalendar(calendar)}
        title="Delete Calendar"
        disabled={!calendar.allowsModifications}
      />
    </View>
  );
};

export default function CalendarsScreen({ navigation }: { navigation: StackNavigation }) {
  const [, askForCalendarPermissions] = Calendar.useCalendarPermissions();
  const [, askForReminderPermissions] = Calendar.useRemindersPermissions();

  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);

  const findCalendars = async () => {
    const calendarGranted = (await askForCalendarPermissions()).granted;
    const reminderGranted =
      Platform.OS === 'ios' ? (await askForReminderPermissions()).granted : true;
    if (calendarGranted && reminderGranted) {
      const eventCalendars = (await Calendar.getCalendarsAsync('event')) as unknown as any[];
      const reminderCalendars = (
        Platform.OS === 'ios' ? await Calendar.getCalendarsAsync('reminder') : []
      ) as any[];
      setCalendars([...eventCalendars, ...reminderCalendars]);
    }
  };

  const addCalendar = async () => {
    const sourceDetails = Platform.select({
      default: () => ({}),
      ios: () => ({
        sourceId: calendars.find((cal) => cal.source && cal.source.name === 'Default')?.source.id,
      }),
      android: () => {
        const calendar = calendars.find(
          (cal) => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
        );
        return calendar ? { source: calendar.source, ownerAccount: calendar.ownerAccount } : {};
      },
    })();
    const newCalendar = {
      title: 'cool new calendar',
      entityType: Calendar.EntityTypes.EVENT,
      color: '#c0ff33',
      ...sourceDetails,
      name: 'coolNewCalendar',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    };
    try {
      await Calendar.createCalendarAsync(newCalendar);
      Alert.alert('Calendar saved successfully');
      findCalendars();
    } catch (e) {
      Alert.alert('Calendar not saved successfully', e.message);
    }
  };

  const updateCalendar = async (calendarId: string) => {
    const newCalendar = {
      title: 'cool updated calendar',
    };
    try {
      await Calendar.updateCalendarAsync(calendarId, newCalendar);
      Alert.alert('Calendar saved successfully');
      findCalendars();
    } catch (e) {
      Alert.alert('Calendar not saved successfully', e.message);
    }
  };

  const deleteCalendar = async (calendar: any) => {
    Alert.alert(`Are you sure you want to delete ${calendar.title}?`, 'This cannot be undone.', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'OK',
        async onPress() {
          try {
            await Calendar.deleteCalendarAsync(calendar.id);
            Alert.alert('Calendar deleted successfully');
            findCalendars();
          } catch (e) {
            Alert.alert('Calendar not deleted successfully', e.message);
          }
        },
      },
    ]);
  };

  if (calendars.length) {
    return (
      <ScrollView style={styles.container}>
        <Button onPress={addCalendar} title="Add New Calendar" />
        {calendars.map((calendar) => (
          <CalendarRow
            calendar={calendar}
            key={calendar.id}
            navigation={navigation}
            updateCalendar={updateCalendar}
            deleteCalendar={deleteCalendar}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Button onPress={findCalendars} title="Find my Calendars" />
    </View>
  );
}

CalendarRow.navigationOptions = {
  title: 'Calendars',
};

CalendarsScreen.navigationOptions = {
  title: 'Calendars',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.greyBackground,
    paddingHorizontal: 10,
    paddingVertical: 16,
    flex: 1,
  },
  calendarRow: {
    marginBottom: 12,
  },
});
