import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Calendar from 'expo-calendar';

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync();
        console.log({ calendars });
      }
    })();
  }, []);

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
