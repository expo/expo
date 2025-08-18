import type { StackNavigationProp } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import { createCalendarNext, ExpoCalendar, getCalendarsNext } from 'expo-calendar/next';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';
import { optionalRequire } from '../navigation/routeBuilder';

export const CalendarsNextScreens = [
  {
    name: 'EventsNext',
    route: 'events-next',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./EventsNextScreen'));
    },
  },
  {
    name: 'RemindersNext',
    route: 'reminders-next',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RemindersNextScreen'));
    },
  },
];

type StackNavigation = StackNavigationProp<{
  RemindersNext: { calendar: ExpoCalendar };
  EventsNext: { calendar: ExpoCalendar };
}>;

const CalendarRow = (props: {
  navigation: StackNavigation;
  calendar: ExpoCalendar;
  updateCalendar: (calendar: ExpoCalendar) => void;
  deleteCalendar: (calendar: ExpoCalendar) => void;
}) => {
  const { calendar } = props;
  const calendarTypeName =
    calendar.entityType === Calendar.EntityTypes.REMINDER ? 'RemindersNext' : 'EventsNext';
  return (
    <View style={styles.calendarRow}>
      <HeadingText>{calendar.title}</HeadingText>
      <MonoText>{JSON.stringify(calendar, null, 2)}</MonoText>
      <ListButton
        onPress={() => props.navigation.navigate(calendarTypeName, { calendar })}
        title={`View ${calendarTypeName}`}
      />
      <ListButton
        onPress={() => props.updateCalendar(calendar)}
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

export default function CalendarsNextScreen({ navigation }: { navigation: StackNavigation }) {
  const [, askForCalendarPermissions] = Calendar.useCalendarPermissions();
  const [, askForReminderPermissions] = Calendar.useRemindersPermissions();

  const [calendars, setCalendars] = useState<ExpoCalendar[]>([]);

  const findCalendars = async () => {
    try {
      const calendarGranted = (await askForCalendarPermissions()).granted;
      const reminderGranted =
        Platform.OS === 'ios' ? (await askForReminderPermissions()).granted : true;
      if (calendarGranted && reminderGranted) {
        const eventCalendars = (await getCalendarsNext(
          Calendar.EntityTypes.EVENT
        )) as unknown as any[];
        const reminderCalendars = (
          Platform.OS === 'ios' ? getCalendarsNext(Calendar.EntityTypes.REMINDER) : []
        ) as any[];
        setCalendars([...eventCalendars, ...reminderCalendars]);
      }
    } catch (e) {
      console.log('error', e);
    }
  };

  const addCalendar = async () => {
    const sourceDetails = Platform.select({
      default: () => ({}),
      ios: () => ({
        sourceId: calendars.find((cal) => cal.source && cal.source.name === 'Default')?.source.id,
      }),
      android: () => {
        const firstCalendar = calendars.find((cal) => cal.source);
        return {
          source: {
            id: firstCalendar?.source?.id || '1',
            type: 'com.google',
            name: 'Default',
            isLocalAccount: false,
          },
          ownerAccount: firstCalendar?.ownerAccount || firstCalendar?.source.name || 'Default',
        };
      },
    })();
    const newCalendar = {
      title: 'cool new calendar',
      color: '#c0ff33',
      ...sourceDetails,
      name: 'coolNewCalendar',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      allowedAttendeeTypes: [Calendar.AttendeeType.REQUIRED, Calendar.AttendeeType.OPTIONAL],
    };

    try {
      const calendar = await createCalendarNext(newCalendar);
      Alert.alert('Calendar saved successfully with id: ' + calendar.id);
      findCalendars();
    } catch (e) {
      Alert.alert('Calendar not saved successfully', e.message);
    }
  };

  const updateCalendar = async (calendar: ExpoCalendar) => {
    const newCalendar = {
      title: 'cool updated calendar' + new Date().toISOString(),
    };
    try {
      calendar.update(newCalendar);
      Alert.alert('Calendar saved successfully');
      findCalendars();
    } catch (e) {
      Alert.alert('Calendar not saved successfully', e.message);
    }
  };

  const deleteCalendar = async (calendar: ExpoCalendar) => {
    Alert.alert(`Are you sure you want to delete ${calendar.title}?`, 'This cannot be undone.', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'OK',
        async onPress() {
          try {
            calendar.delete();
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
  title: 'Calendars@next',
};

CalendarsNextScreen.navigationOptions = {
  title: 'Calendars@next',
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
