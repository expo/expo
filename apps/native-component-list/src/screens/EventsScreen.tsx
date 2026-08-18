import * as Calendar from 'expo-calendar/legacy';
import { type NativeStackScreenProps } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

const EventRow: React.FunctionComponent<{
  event: Calendar.Event;
  getEvent: (event: Calendar.Event) => void;
  getAttendees: (event: Calendar.Event) => void;
  updateEvent: (event: Calendar.Event) => void;
  deleteEvent: (event: Calendar.Event) => void;
  openEventInCalendar: (event: Calendar.Event) => void;
  editEventInCalendar: (event: Calendar.Event) => void;
}> = ({
  event,
  getEvent,
  getAttendees,
  updateEvent,
  deleteEvent,
  openEventInCalendar,
  editEventInCalendar,
}) => (
  <View style={styles.eventRow}>
    <HeadingText>{event.title}</HeadingText>
    <MonoText>{JSON.stringify(event, null, 2)}</MonoText>
    <ListButton onPress={() => getEvent(event)} title="Get Event Using ID" />
    <ListButton onPress={() => getAttendees(event)} title="Get Attendees for Event" />
    <ListButton onPress={() => updateEvent(event)} title="Update Event" />
    <ListButton onPress={() => deleteEvent(event)} title="Delete Event" />
    <ListButton onPress={() => openEventInCalendar(event)} title="Open in Calendar App" />
    <ListButton onPress={() => editEventInCalendar(event)} title="Edit in Calendar App" />
  </View>
);

interface State {
  events: Calendar.Event[];
  calendar: Calendar.Calendar | null;
}

// Route params must stay serializable, so this screen receives the id and refetches the calendar.
type Links = {
  Events: { calendarId: string };
};

type Props = NativeStackScreenProps<Links, 'Events'>;

function createEvent(calendarId: string, recurring: boolean = false) {
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

export default class EventsScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Events',
  };

  readonly state: State = {
    events: [],
    calendar: null,
  };

  componentDidMount() {
    const calendarId = this.props.route.params?.calendarId;
    if (calendarId) {
      this._loadCalendar(calendarId);
      this._findEvents(calendarId);
    }
  }

  _loadCalendar = async (calendarId: string) => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    this.setState({ calendar: calendars.find(({ id }) => id === calendarId) ?? null });
  };

  _findEvents = async (id: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const events = await Calendar.getEventsAsync([id], yesterday, nextYear);
    this.setState({ events });
  };

  _addEvent = async (recurring: boolean) => {
    const { calendar } = this.state;
    if (!calendar) {
      Alert.alert('Calendar is not loaded yet');
      return;
    }
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }

    try {
      const newEvent = createEvent(calendar.id, recurring);
      await Calendar.createEventAsync(calendar.id, newEvent);
      Alert.alert('Event saved successfully');
      this._findEvents(calendar.id);
    } catch (e: any) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  _getEvent = async (event: Calendar.Event) => {
    try {
      const newEvent = await Calendar.getEventAsync(event.id!, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Event found using getEventAsync', JSON.stringify(newEvent));
    } catch (e: any) {
      Alert.alert('Error finding event', e.message);
    }
  };

  _getAttendees = async (event: Calendar.Event) => {
    try {
      const attendees = await Calendar.getAttendeesForEventAsync(event.id!, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Attendees found using getAttendeesForEventAsync', JSON.stringify(attendees));
    } catch (e: any) {
      Alert.alert('Error finding attendees', e.message);
    }
  };

  _updateEvent = async (event: Calendar.Event) => {
    const { calendar } = this.state;
    if (!calendar) {
      Alert.alert('Calendar is not loaded yet');
      return;
    }
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const newEvent = {
      title: 'update test',
    };
    try {
      await Calendar.updateEventAsync(event.id!, newEvent, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Event saved successfully');
      this._findEvents(calendar.id);
    } catch (e: any) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  _deleteEvent = async (event: Calendar.Event) => {
    try {
      const { calendarId } = this.props.route.params!;
      await Calendar.deleteEventAsync(event.id!, {
        futureEvents: false,
        instanceStartDate: event.recurrenceRule ? event.startDate : undefined,
      });
      Alert.alert('Event deleted successfully');
      this._findEvents(calendarId);
    } catch (e: any) {
      Alert.alert('Event not deleted successfully', e.message);
    }
  };

  _openEventInCalendar = async (event: Calendar.Event) => {
    const result = await Calendar.openEventInCalendarAsync(
      {
        id: event.id,
      },
      {
        startNewActivityTask: false,
        allowsEditing: true,
        allowsCalendarPreview: true,
      }
    );
    setTimeout(() => {
      Alert.alert('openEventInCalendarAsync result', JSON.stringify(result), undefined, {
        cancelable: true,
      });
    }, 200);
  };

  _editEventInCalendar = async (event: Calendar.Event) => {
    const result = await Calendar.editEventInCalendarAsync({ id: event.id });
    setTimeout(() => {
      Alert.alert('editEventInCalendarAsync result', JSON.stringify(result), undefined, {
        cancelable: true,
      });
    }, 200);
  };

  _renderActionButtons = () => {
    return (
      <View style={{ gap: 10 }}>
        <Button
          title="get permissions"
          onPress={() => {
            Calendar.requestCalendarPermissionsAsync();
          }}
        />
        <Button onPress={() => this._addEvent(false)} title="Add New Event" />
        <Button onPress={() => this._addEvent(true)} title="Add New Recurring Event" />
        <Button
          onPress={async () => {
            const { calendarId } = this.props.route.params!;
            const newEvent = createEvent(calendarId);
            const result = await Calendar.createEventInCalendarAsync(newEvent);
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

  render() {
    if (!this.props.route.params?.calendarId) {
      return <Text>Access this screen from the "Calendars" screen.</Text>;
    }
    const events = this.state.events.length ? (
      <View>
        {this.state.events.map((event) => (
          <EventRow
            event={event}
            key={`${event.id}${event.startDate}`}
            getEvent={this._getEvent}
            getAttendees={this._getAttendees}
            updateEvent={this._updateEvent}
            deleteEvent={this._deleteEvent}
            openEventInCalendar={this._openEventInCalendar}
            editEventInCalendar={this._editEventInCalendar}
          />
        ))}
      </View>
    ) : (
      <Text style={{ marginVertical: 12 }}>This calendar has no events.</Text>
    );
    return (
      <ScrollView style={styles.container}>
        {this._renderActionButtons()}
        {events}
      </ScrollView>
    );
  }
}

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
