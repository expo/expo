import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'expo';
import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import ListButton from '../components/ListButton';
import MonoText from '../components/MonoText';

class EventRow extends React.Component {
  render() {
    const { event } = this.props;
    return (
      <View style={styles.eventRow}>
        <HeadingText>{event.title}</HeadingText>
        <MonoText>{JSON.stringify(event, null, 2)}</MonoText>
        <ListButton onPress={() => this.props.getEvent(event)} title="Get Event Using ID" />
        <ListButton
          onPress={() => this.props.getAttendees(event)}
          title="Get Attendees for Event"
        />
        <ListButton onPress={() => this.props.updateEvent(event)} title="Update Event" />
        <ListButton onPress={() => this.props.deleteEvent(event)} title="Delete Event" />
        {Platform.OS === 'android' && (
          <ListButton
            onPress={() => this.props.openEventInCalendar(event)}
            title="Open in Calendar App"
          />
        )}
      </View>
    );
  }
}

export default class EventsScreen extends React.Component {
  static navigationOptions = {
    title: 'Events',
  };

  state = {
    events: [],
  };

  componentDidMount() {
    const { params } = this.props.navigation.state;
    const { id } = params.calendar;
    if (id) {
      this._findEvents(id);
    }
  }

  _findEvents = async id => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const events = await Calendar.getEventsAsync([id], yesterday, nextYear);
    this.setState({ events });
  };

  _addEvent = async recurring => {
    const { calendar } = this.props.navigation.state.params;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const timeInOneHour = new Date();
    timeInOneHour.setHours(timeInOneHour.getHours() + 1);
    const newEvent = {
      title: 'Celebrate Expo',
      location: '420 Florence St',
      startDate: new Date(),
      endDate: timeInOneHour,
      notes: "It's cool",
      timeZone: 'America/Los_Angeles',
    };
    if (recurring) {
      newEvent.recurrenceRule = {
        occurrence: 5,
        frequency: 'daily',
      };
    }
    try {
      await Calendar.createEventAsync(calendar.id, newEvent);
      Alert.alert('Event saved successfully');
      this._findEvents(calendar.id);
    } catch (e) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  _getEvent = async event => {
    try {
      const newEvent = await Calendar.getEventAsync(event.id, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Event found using getEventAsync', JSON.stringify(newEvent));
    } catch (e) {
      Alert.alert('Error finding event', e.message);
    }
  };

  _getAttendees = async event => {
    try {
      const attendees = await Calendar.getAttendeesForEventAsync(event.id, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Attendees found using getAttendeesForEventAsync', JSON.stringify(attendees));
    } catch (e) {
      Alert.alert('Error finding attendees', e.message);
    }
  };

  _updateEvent = async event => {
    const { calendar } = this.props.navigation.state.params;
    if (!calendar.allowsModifications) {
      Alert.alert('This calendar does not allow modifications');
      return;
    }
    const newEvent = {
      title: 'update test',
    };
    try {
      await Calendar.updateEventAsync(event.id, newEvent, {
        futureEvents: false,
        instanceStartDate: event.startDate,
      });
      Alert.alert('Event saved successfully');
      this._findEvents(calendar.id);
    } catch (e) {
      Alert.alert('Event not saved successfully', e.message);
    }
  };

  _deleteEvent = async event => {
    try {
      const { calendar } = this.props.navigation.state.params;
      await Calendar.deleteEventAsync(event.id, {
        futureEvents: false,
        instanceStartDate: event.recurrenceRule ? event.startDate : undefined,
      });
      Alert.alert('Event deleted successfully');
      this._findEvents(calendar.id);
    } catch (e) {
      Alert.alert('Event not deleted successfully', e.message);
    }
  };

  _openEventInCalendar = event => {
    Calendar.openEventInCalendar(event.id);
  };

  _renderActionButtons = () => {
    return (
      <View>
        <Button
          onPress={() => this._addEvent(false)}
          style={{ marginBottom: 10 }}
          title="Add New Event"
        />
        <Button onPress={() => this._addEvent(true)} title="Add New Recurring Event" />
      </View>
    );
  };

  render() {
    const events = this.state.events.length ? (
      <View>
        {this.state.events.map(event => (
          <EventRow
            event={event}
            key={`${event.id}${event.startDate}`}
            getEvent={this._getEvent}
            getAttendees={this._getAttendees}
            updateEvent={this._updateEvent}
            deleteEvent={this._deleteEvent}
            openEventInCalendar={this._openEventInCalendar}
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
