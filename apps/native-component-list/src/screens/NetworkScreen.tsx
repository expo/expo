import * as Network from 'expo-network';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

interface NetworkStateEvent {
  time: Date;
  key: number;
  networkState: Network.NetworkStateEvent;
}

export default function NetworkScreen() {
  const isMounted = React.useRef(true);
  const [airplaneMode] = useResolvedValue(Network.isAirplaneModeEnabledAsync);
  const [networkState] = useResolvedValue(Network.getNetworkStateAsync);
  const [ip, ipError] = useResolvedValue(Network.getIpAddressAsync);
  const [events, setEvents] = useState<NetworkStateEvent[]>([]);
  const networkStateHook = Network.useNetworkState();

  React.useEffect(() => {
    if (ipError) alert(ipError.message);
  }, [ipError]);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setEvents((events) => {
      return [
        ...events,
        {
          networkState: networkStateHook,
          time: new Date(),
          key: events.length,
        },
      ];
    });
  }, [networkStateHook]);

  return (
    <ScrollView style={{ padding: 10 }}>
      <MonoText>
        {JSON.stringify(
          {
            ipAddress: ip,
            networkState,
            airplaneModeEnabled: airplaneMode,
          },
          null,
          2
        )}
      </MonoText>
      <Text>
        💡 <Text style={{ fontWeight: 'bold' }}>airplaneModeEnabled</Text> is only supported on
        Android. It should be <Text style={{ fontWeight: 'bold' }}>null</Text> on iOS.
      </Text>
      <HeadingText>Network current state:</HeadingText>
      <MonoText>{JSON.stringify(networkStateHook, null, 2)}</MonoText>

      <HeadingText>Network state events:</HeadingText>
      {events.map((event) => (
        <View key={event.key}>
          <HeadingText style={{ fontSize: 14 }}>{String(event.time)}</HeadingText>
          <MonoText key={event.key}>{JSON.stringify(event.networkState, null, 2)}</MonoText>
        </View>
      ))}
    </ScrollView>
  );
}
