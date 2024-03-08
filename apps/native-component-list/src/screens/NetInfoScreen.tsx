import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

interface ConnectionEvent {
  time: Date;
  key: number;
  connectionInfo: NetInfoState;
}

export default function NetInfoScreen() {
  const [events, setEvents] = useState<ConnectionEvent[]>([]);
  const connectionInfo = NetInfo.useNetInfo();

  useEffect(() => {
    setEvents((events) => {
      return [
        ...events,
        {
          connectionInfo,
          time: new Date(),
          key: events.length,
        },
      ];
    });
  }, [connectionInfo]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.greyBackground }}
      contentContainerStyle={{ padding: 10 }}>
      <HeadingText>NetInfo current state:</HeadingText>
      <MonoText>{JSON.stringify(connectionInfo, null, 2)}</MonoText>

      <HeadingText>NetInfo events:</HeadingText>
      {events.map((event) => (
        <View key={event.key}>
          <HeadingText style={{ fontSize: 14 }}>{String(event.time)}</HeadingText>
          <MonoText key={event.key}>{JSON.stringify(event.connectionInfo, null, 2)}</MonoText>
        </View>
      ))}
    </ScrollView>
  );
}

NetInfoScreen.navigationOptions = {
  title: 'NetInfo',
};
