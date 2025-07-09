import { GoogleMaps } from 'expo-maps';
import { View, StyleSheet } from 'react-native';

import { FunctionParameter, useArguments } from '../../../components/FunctionDemo';
import Configurator from '../../../components/FunctionDemo/Configurator';

const parameters: FunctionParameter[] = [
  {
    name: 'isBuildingEnabled',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'mapType',
    type: 'enum',
    values: [
      { name: 'NORMAL', value: GoogleMaps.MapType.NORMAL },
      { name: 'HYBRID', value: GoogleMaps.MapType.HYBRID },
      { name: 'SATELLITE', value: GoogleMaps.MapType.SATELLITE },
      { name: 'TERRAIN', value: GoogleMaps.MapType.TERRAIN },
    ],
    platforms: ['android'],
  },
  {
    name: 'isIndoorEnabled',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'selectionEnabled',
    type: 'boolean',
    initial: true,
    platforms: ['ios'],
  },
  {
    name: 'isMyLocationEnabled',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'isTrafficEnabled',
    type: 'boolean',
    initial: false,
  },
  { name: 'minZoomPreference', type: 'number', values: [1, 5, 10, 20] },
  { name: 'maxZoomPreference', type: 'number', values: [5, 10, 20, 30] },
];

export default function MapsCameraControlsScreen() {
  const [args, updateArgument] = useArguments(parameters);
  const [
    isBuildingEnabled,
    mapType,
    isIndoorEnabled,
    selectionEnabled,
    isMyLocationEnabled,
    isTrafficEnabled,
    minZoomPreference,
    maxZoomPreference,
  ] = args as [boolean, GoogleMaps.MapType, boolean, boolean, boolean, boolean, number, number];
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <GoogleMaps.View
          style={{ width: 'auto', height: '100%' }}
          cameraPosition={{
            coordinates: {
              latitude: 37.78825,
              longitude: -122.4324,
            },
            zoom: 8,
          }}
          properties={{
            isBuildingEnabled,
            mapType,
            isIndoorEnabled,
            selectionEnabled,
            isMyLocationEnabled,
            isTrafficEnabled,
            minZoomPreference,
            maxZoomPreference,
          }}
        />
      </View>

      <View style={styles.configurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
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
