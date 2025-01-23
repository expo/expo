import { AppleMapType, ExpoMapsView, MapType } from 'expo-maps-remake';
import { View, StyleSheet } from 'react-native';

import { FunctionParameter, useArguments } from '../../components/FunctionDemo';
import Configurator from '../../components/FunctionDemo/Configurator';

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
      { name: 'NORMAL', value: MapType.NORMAL },
      { name: 'HYBRID', value: MapType.HYBRID },
      { name: 'SATELLITE', value: MapType.SATELLITE },
      { name: 'TERRAIN', value: MapType.TERRAIN },
    ],
    platforms: ['android'],
  },
  {
    name: 'mapTypeIos',
    type: 'enum',
    values: [
      { name: 'STANDARD', value: AppleMapType.STANDARD },
      { name: 'HYBRID', value: AppleMapType.HYBRID },
      { name: 'IMAGERY', value: AppleMapType.IMAGERY },
    ],
    platforms: ['ios'],
  },
  {
    name: 'isIndoorEnabled',
    type: 'boolean',
    initial: false,
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
    mapTypeIos,
    isIndoorEnabled,
    isMyLocationEnabled,
    isTrafficEnabled,
    minZoomPreference,
    maxZoomPreference,
  ] = args as [boolean, MapType, AppleMapType, boolean, boolean, boolean, number, number];
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <ExpoMapsView
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
            mapTypeIos,
            isIndoorEnabled,
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
