import type { StackNavigationProp } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import { createCalendarNext, ExpoCalendar, getCalendarsNext } from 'expo-calendar/next';
import { useState, useEffect } from 'react';
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

export default function CalendarsNextScreen({ navigation }: { navigation: StackNavigation }) {
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const calendars = await getCalendarsNext();
        for (const calendar of calendars) {
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const events = await calendar.listEvents(oneWeekAgo, oneWeekFromNow);
          console.log(
            'events',
            events.map((event) => event.title)
          );
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchCalendars();
  }, []);
  return (
    <View style={styles.container}>
      <MonoText>{JSON.stringify('ad', null, 2)}</MonoText>
    </View>
  );
}

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
