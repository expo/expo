import { AppleMaps, getPermissionsAsync, requestPermissionsAsync } from 'expo-maps';
import { StyleSheet, View } from 'react-native';

import SimpleActionDemo from '../../../components/SimpleActionDemo';

export default function MapsPermissionsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <AppleMaps.View style={{ width: 'auto', height: '100%' }} />
      </View>

      <View style={styles.configurator}>
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
