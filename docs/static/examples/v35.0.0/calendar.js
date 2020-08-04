import React from 'react';
import { View, Text } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions';

export default class App extends React.Component {
  componentDidMount = async () => {
    const { status } = await Permissions.askAsync(Permissions.CALENDAR);
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync();
      console.log({ calendars });
    }
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>Calendar Module Example</Text>
      </View>
    );
  }
}
