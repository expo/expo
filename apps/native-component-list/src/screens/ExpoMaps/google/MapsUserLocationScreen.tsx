import { GoogleMaps } from 'expo-maps';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import { FunctionParameter, useArguments } from '../../../components/FunctionDemo';
import Configurator from '../../../components/FunctionDemo/Configurator';

const parameters: FunctionParameter[] = [
  {
    name: 'isMyLocationEnabled',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'followUserLocation',
    type: 'boolean',
    initial: false,
  },
];

export default function MapsUserLocationScreen() {
  const [args, updateArgument] = useArguments(parameters);
  const [isMyLocationEnabled, followUserLocation] = args as [boolean, boolean];
  const [offset, setOffset] = useState(0);
  const ref = useRef<GoogleMaps.MapViewType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prevOffset) => prevOffset + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <GoogleMaps.View
          ref={ref}
          style={{ width: 'auto', height: '100%' }}
          cameraPosition={{
            coordinates: {
              latitude: 37.78825,
              longitude: -122.4324,
            },
            zoom: 15,
          }}
          properties={{
            isMyLocationEnabled,
            maxZoomPreference: 15,
          }}
          userLocation={{
            coordinates: {
              latitude: 37.78825 - 0.0001 * offset,
              longitude: -122.4324 + 0.0001 * offset,
            },
            followUserLocation,
          }}
        />
      </View>

      <View style={styles.configurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
        <Button title="Set empty" onPress={() => ref.current?.setCameraPosition()} />
        <Button
          title="Set 0, 0"
          onPress={() =>
            ref.current?.setCameraPosition({ coordinates: { latitude: 0, longitude: 0 } })
          }
        />
        <Button
          title="Set random"
          onPress={() =>
            ref.current?.setCameraPosition({
              coordinates: {
                latitude: Math.random() * 360 - 180,
                longitude: Math.random() * 360 - 180,
              },
              zoom: Math.random() * 20,
              duration: 5000,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  configurator: {
    paddingHorizontal: 15,
  },
});
