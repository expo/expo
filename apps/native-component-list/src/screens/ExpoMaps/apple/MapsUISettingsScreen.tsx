import { AppleMaps } from 'expo-maps';
import { View, StyleSheet } from 'react-native';

import { FunctionParameter, useArguments } from '../../../components/FunctionDemo';
import Configurator from '../../../components/FunctionDemo/Configurator';

const parameters: FunctionParameter[] = [
  {
    name: 'compassEnabled',
    type: 'boolean',
    initial: true,
  },
  {
    name: 'myLocationButtonEnabled',
    type: 'boolean',
    initial: true,
  },
  {
    name: 'scaleBarEnabled',
    type: 'boolean',
    initial: true,
  },
  {
    name: 'togglePitchEnabled',
    type: 'boolean',
    initial: true,
  },
];

export default function MapsUISettings() {
  const [args, updateArgument] = useArguments(parameters);
  const [compassEnabled, myLocationButtonEnabled, scaleBarEnabled, togglePitchEnabled] = args as [
    boolean,
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
          uiSettings={{
            compassEnabled,
            myLocationButtonEnabled,
            scaleBarEnabled,
            togglePitchEnabled,
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
