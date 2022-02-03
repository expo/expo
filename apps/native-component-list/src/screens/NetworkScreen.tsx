import * as Network from 'expo-network';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function NetworkScreen() {
  const isMounted = React.useRef(true);
  const [airplaneMode] = useResolvedValue(Network.isAirplaneModeEnabledAsync);
  const [networkState] = useResolvedValue(Network.getNetworkStateAsync);
  const [ip, ipError] = useResolvedValue(Network.getIpAddressAsync);

  React.useEffect(() => {
    if (ipError) alert(ipError.message);
  }, [ipError]);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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
    </ScrollView>
  );
}
