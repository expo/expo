import * as Maps from 'expo-maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function GoogleMapsStylingExample() {
  return (
    <View style={styles.container}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider="google"
        googleMapsJsonStyleString={JSON.stringify(
          require('../../../../assets/expo-maps/exampleMapStyle.json')
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
