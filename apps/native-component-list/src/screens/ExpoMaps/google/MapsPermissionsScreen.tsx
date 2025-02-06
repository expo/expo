import { getPermissionsAsync, GoogleMaps, requestPermissionsAsync } from 'expo-maps';
import { StyleSheet, View } from 'react-native';

import { FunctionParameter, useArguments } from '../../../components/FunctionDemo';
import Configurator from '../../../components/FunctionDemo/Configurator';
import SimpleActionDemo from '../../../components/SimpleActionDemo';

const parameters: FunctionParameter[] = [
  {
    name: 'isMyLocationEnabled',
    type: 'boolean',
    initial: false,
  },
];

export default function MapsPermissionsScreen() {
  const [args, updateArgument] = useArguments(parameters);
  const [isMyLocationEnabled] = args as [boolean];
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
            zoom: 15,
          }}
          properties={{
            isMyLocationEnabled,
            maxZoomPreference: 15,
          }}
        />
      </View>

      <View style={styles.configurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
        <SimpleActionDemo
          title="requestPermissionsAsync"
          action={() => requestPermissionsAsync()}
        />
        <SimpleActionDemo title="getPermissionsAsync" action={() => getPermissionsAsync()} />
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
