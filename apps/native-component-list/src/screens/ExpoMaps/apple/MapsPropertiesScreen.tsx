import { AppleMaps } from 'expo-maps';
import { View, StyleSheet } from 'react-native';

import { FunctionParameter, useArguments } from '../../../components/FunctionDemo';
import Configurator from '../../../components/FunctionDemo/Configurator';

const parameters: FunctionParameter[] = [
  {
    name: 'mapType',
    type: 'enum',
    values: [
      { name: 'STANDARD', value: AppleMaps.MapType.STANDARD },
      { name: 'HYBRID', value: AppleMaps.MapType.HYBRID },
      { name: 'IMAGERY', value: AppleMaps.MapType.IMAGERY },
    ],
  },
  {
    name: 'selectionEnabled',
    type: 'boolean',
    initial: true,
  },
  {
    name: 'isTrafficEnabled',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'isMyLocationEnabled',
    type: 'boolean',
    initial: false,
  },
];

export default function MapsCameraControlsScreen() {
  const [args, updateArgument] = useArguments(parameters);
  const [mapType, selectionEnabled, isTrafficEnabled, isMyLocationEnabled] = args as [
    AppleMaps.MapType,
    boolean,
    boolean,
    boolean,
  ];
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <AppleMaps.View
          style={{ width: 'auto', height: '100%' }}
          cameraPosition={{
            coordinates: {
              latitude: 37.78825,
              longitude: -122.4324,
            },
            zoom: 8,
          }}
          properties={{
            mapType,
            selectionEnabled,
            isTrafficEnabled,
            isMyLocationEnabled,
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
