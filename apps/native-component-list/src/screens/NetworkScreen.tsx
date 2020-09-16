import * as Network from 'expo-network';
import * as React from 'react';
import { Platform, ScrollView, TextInput } from 'react-native';

import MonoText from '../components/MonoText';
import { useResolvedValue } from '../utilities/useResolvedValue';

export default function NetworkScreen() {
  const [name, setName] = React.useState('');
  const isMounted = React.useRef(true);
  const [customMacAddress, setCustomMacAddress] = React.useState('');
  const [airplaneMode] = useResolvedValue(Network.isAirplaneModeEnabledAsync);
  const [networkState] = useResolvedValue(Network.getNetworkStateAsync);
  const [ip, ipError] = useResolvedValue(Network.getIpAddressAsync);
  const [macAddress] = useResolvedValue(Network.getMacAddressAsync);
  // Test two common interface names on Android.
  const [eth0MacAddress] = useResolvedValue(
    (): Promise<string> => Network.getMacAddressAsync('eth0')
  );
  const [wlan0MacAddress] = useResolvedValue(
    (): Promise<string> => Network.getMacAddressAsync('wlan0')
  );

  React.useEffect(() => {
    if (ipError) alert(ipError.message);
  }, [ipError]);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  React.useEffect(() => {
    Network.getMacAddressAsync(name || null)
      .then(address => {
        if (isMounted.current) {
          setCustomMacAddress(address);
        }
      })
      .catch(() => {
        setCustomMacAddress('');
      });
  }, [name]);

  return (
    <ScrollView style={{ padding: 10 }}>
      <MonoText>
        {JSON.stringify(
          {
            ipAddress: ip,
            networkState: networkState,
            airplaneModeEnabled: airplaneMode,
            macAddress: macAddress,
            eth0_macAddress: eth0MacAddress,
            wlan0_macAddress: wlan0MacAddress,
            custom_macAddress: customMacAddress,
          },
          null,
          2
        )}
      </MonoText>
      {Platform.OS === 'android' && (
        <TextInput
          autoCapitalize={'none'}
          autoCorrect={false}
          placeholder="Mac Address interface name"
          value={name}
          onChangeText={setName}
        />
      )}
    </ScrollView>
  );
}
