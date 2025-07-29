import type { StackNavigationProp } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import {
  ExportExpoCalendar,
  ExportExpoCalendarEvent,
  getCalendarsNext,
  getDefaultCalendarNext,
} from 'expo-calendar/next';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';
import { optionalRequire } from '../navigation/routeBuilder';

export const CalendarsScreens = [
  {
    name: 'Events',
    route: 'events',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./EventsScreen'));
    },
  },
];

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

  const getDefaultCalendar = async () => {
    try {
      console.log('=== Testing expo-calendar/next API ===');

      // Test date range (one week ago to one week from now)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const calendarsNext = getCalendarsNext();
      const calendar = calendarsNext[5];
      const events = calendar.listEvents(oneWeekAgo, oneWeekFromNow);

      console.log('Events:', calendar.title, events.length);

      for (const event of events) {
        const attendees = event.getAttendees();
        console.log('Attendees of event:', event.title, attendees.map((a) => a.name));
      }
    } catch (error) {
      console.error('Error testing expo-calendar/next:', error);
      Alert.alert('Error', `Failed to test expo-calendar/next: ${error.message}`);
    }
  };

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

  const addEvent = async () => {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    console.log('defaultCalendar', defaultCalendar);
    const calendar = new ExportExpoCalendar(defaultCalendar.id);
    console.log('calendar', calendar);
    const endDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const event = calendar.createEvent(
      {
        title: 'Test',
        startDate: new Date(),
        endDate,
      },
      {}
    );
    console.log('Event added:', event);
  };

  //   if (calendars.length) {
  //     return (
  //       <ScrollView style={styles.container}>
  //         <Button onPress={addCalendar} title="Add New Calendar" />
  //         {calendars.map((calendar) => (
  //           <CalendarRow
  //             calendar={calendar}
  //             key={calendar.id}
  //             navigation={navigation}
  //             updateCalendar={updateCalendar}
  //             deleteCalendar={deleteCalendar}
  //           />
  //         ))}
  //       </ScrollView>
  //     );
  //   }

  return (
    <View style={styles.container}>
      <Button onPress={findCalendars} title="Find my Calendars" />
      <Button onPress={getDefaultCalendar} title="Get Default Calendar" />
      <Button onPress={addEvent} title="Add Event" />
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
