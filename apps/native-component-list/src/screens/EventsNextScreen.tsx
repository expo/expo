import { StackScreenProps } from '@react-navigation/stack';
import * as Calendar from 'expo-calendar';
import { ExpoCalendar, ExpoCalendarEvent } from 'expo-calendar/next';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

type EventRowProps = {
  event: ExpoCalendarEvent;
  getEvent: (event: ExpoCalendarEvent) => void;
  getAttendees: (event: ExpoCalendarEvent) => void;
  createAttendee: (event: ExpoCalendarEvent) => void;
  updateEvent: (event: ExpoCalendarEvent) => void;
  deleteEvent: (event: ExpoCalendarEvent) => void;
  openEventInCalendar: (event: ExpoCalendarEvent) => void;
  editEventInCalendar: (event: ExpoCalendarEvent) => void;
};

const EventRow = ({
  event,
  getEvent,
  getAttendees,
  createAttendee,
  updateEvent,
  deleteEvent,
  openEventInCalendar,
  editEventInCalendar,
}: EventRowProps) => (
  <View style={styles.eventRow}>
    <HeadingText>{event.title}</HeadingText>
    <MonoText>{JSON.stringify(event, null, 2)}</MonoText>
    <ListButton onPress={() => getEvent(event)} title="Get Event Using ID" />
    <ListButton onPress={() => getAttendees(event)} title="Get Attendees for Event" />
    <ListButton onPress={() => createAttendee(event)} title="Create Attendee" />
    <ListButton onPress={() => updateEvent(event)} title="Update Event" />
    <ListButton onPress={() => deleteEvent(event)} title="Delete Event" />
    <ListButton onPress={() => openEventInCalendar(event)} title="Open in Calendar App" />
    <ListButton onPress={() => editEventInCalendar(event)} title="Edit in Calendar App" />
  </View>
);

type Links = {
  Events: { calendar: ExpoCalendar };
};

type Props = StackScreenProps<Links, 'Events'>;

function prepareEvent(calendarId: string, recurring: boolean = false) {
  const timeInOneHour = new Date();
  timeInOneHour.setHours(timeInOneHour.getHours() + 1);
  const newEvent: Parameters<typeof Calendar.createEventAsync>[1] = {
    title: 'Celebrate Expo',
    location: '420 Florence St',
    startDate: new Date(),
    endDate: timeInOneHour,
    notes: 'This is a cool note',
    timeZone: 'America/Los_Angeles',
    calendarId,
  };
  if (recurring) {
    newEvent.recurrenceRule = {
      occurrence: 5,
      frequency: Calendar.Frequency.DAILY,
    };
  }
  return newEvent;
}

const EventsScreen = ({ route }: Props) => {
  const [events, setEvents] = useState<ExpoCalendarEvent[]>([]);

  const findEvents = async (calendar: ExpoCalendar) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const events = await calendar.listEvents(yesterday, nextYear);
    const sortedEvents = events.sort((a, b) => Number(a.id) - Number(b.id));
    setEvents(sortedEvents);
  };

  const calendar = route.params?.calendar;

  useEffect(() => {
    if (calendar) {
      findEvents(calendar);
    }
  }, [calendar]);

  const addEvent = async (recurring: boolean) => {
    const { calendar } = route.params!;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }

    try {
      const newEvent = prepareEvent(calendar.id, recurring);
      const event = await calendar.createEvent(newEvent);
      console.log('event', JSON.stringify(event, null, 2));
      Alert.alert('Event saved successfully');
      findEvents(calendar);
    } catch (e) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  const getEvent = async (event: ExpoCalendarEvent) => {
    try {
      const newEvent = await Calendar.getEventAsync(event.id!, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Event found using getEventAsync', JSON.stringify(newEvent));
    } catch (e) {
      Alert.alert('Error finding event', e.message);
    }
  };

  const getAttendees = async (event: ExpoCalendarEvent) => {
    try {
      const attendees = await event.getAttendees();
      Alert.alert('Attendees found using getAttendees', JSON.stringify(attendees));
    } catch (e) {
      Alert.alert('Error finding attendees', e.message);
    }
  };

  const createAttendee = async (event: ExpoCalendarEvent) => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('createAttendee is not supported on this platform');
        return;
      }
      const attendee = await event.createAttendee({
        email: 'test@example.com',
        name: 'Test Attendee',
        type: Calendar.AttendeeType.RESOURCE,
        status: Calendar.AttendeeStatus.PENDING,
        role: Calendar.AttendeeRole.SPEAKER,
      });
      Alert.alert('Attendee created using createAttendee', JSON.stringify(attendee));
    } catch (e) {
      Alert.alert('Error creating attendee', e.message);
    }
  };

  const updateEvent = async (event: ExpoCalendarEvent) => {
    const { calendar } = route.params!;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24);
    const newEvent = {
      title: 'update test ' + new Date().toISOString(),
      startDate,
      endDate,
    };
    try {
      await event.update(newEvent, {
        futureEvents: false,
      });
      Alert.alert('Event saved successfully');
      findEvents(calendar);
    } catch (e) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  const deleteEvent = async (event: ExpoCalendarEvent) => {
    try {
      event.delete({
        futureEvents: false,
        instanceStartDate: event.recurrenceRule ? event.startDate : undefined,
      });
      Alert.alert('Event deleted successfully');
      if (calendar) {
        findEvents(calendar);
      }
    } catch (e) {
      Alert.alert('Event not deleted successfully', e.message);
    }
  };

  const openEventInCalendar = async (event: ExpoCalendarEvent) => {
    const result = await event.openInCalendarAsync({
      startNewActivityTask: false,
      allowsEditing: true,
      allowsCalendarPreview: true,
    });
    setTimeout(() => {
      Alert.alert('openEventInCalendarAsync result', JSON.stringify(result), undefined, {
        cancelable: true,
      });
    }, 200);
  };

  const editEventInCalendar = async (event: ExpoCalendarEvent) => {
    const result = await event.editInCalendarAsync(null);
    setTimeout(() => {
      Alert.alert('editEventInCalendarAsync result', JSON.stringify(result), undefined, {
        cancelable: true,
      });
    }, 200);
  };

  const renderActionButtons = () => {
    return (
      <View style={{ gap: 10 }}>
        <Button
          title="get permissions"
          onPress={() => {
            Calendar.requestCalendarPermissionsAsync();
          }}
        />
        <Button onPress={() => addEvent(false)} title="Add New Event" />
        <Button onPress={() => addEvent(true)} title="Add New Recurring Event" />
        <Button
          onPress={async () => {
            const { calendar } = route.params!;
            const newEvent = prepareEvent(calendar.id);
            const result = calendar.createEvent(newEvent);
            setTimeout(() => {
              Alert.alert('createEventInCalendarAsync result', JSON.stringify(result), undefined, {
                cancelable: true,
              });
            }, 200);
          }}
          title="Create Event using the OS dialog"
        />
      </View>
    );
  };

  if (!route.params?.calendar) {
    return <Text>Access this screen from the "Calendars" screen.</Text>;
  }

  const eventsComponent = events.length ? (
    <View>
      {events.map((event) => (
        <EventRow
          event={event}
          key={`${event.id}${event.startDate}`}
          getEvent={getEvent}
          getAttendees={getAttendees}
          createAttendee={createAttendee}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
          openEventInCalendar={openEventInCalendar}
          editEventInCalendar={editEventInCalendar}
        />
      ))}
    </View>
  ) : (
    <Text style={{ marginVertical: 12 }}>This calendar has no events.</Text>
  );

  return (
    <ScrollView style={styles.container}>
      {renderActionButtons()}
      {eventsComponent}
    </ScrollView>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 16,
    flex: 1,
  },
  eventRow: {
    marginBottom: 12,
  },
});
