import * as Location from 'expo-location';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import SimpleActionDemo from '../../components/SimpleActionDemo';
import usePermissions from '../../utilities/usePermissions';

const forwardGeocodingAddresses = [
  '1 Hacker Way, CA',
  'Palo Alto Caltrain Station',
  'Rogers Arena, Vancouver',
  'Zabłocie 43b, Kraków',
  'Amsterdam Centraal',
  ':-(',
];

const reverseGeocodingCoords = [
  { latitude: 49.28, longitude: -123.12 }, // Seymour St, Vancouver
  { latitude: 50.0615298, longitude: 19.9372142 }, // Main Square, Kraków
  { latitude: 52.3730983, longitude: 4.8909126 }, // Dam Square, Amsterdam
  { latitude: 0, longitude: 0 }, // North Atlantic Ocean
];

export default function GeocodingScreen() {
  usePermissions(Location.requestForegroundPermissionsAsync);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Forward-Geocoding</Text>
      </View>
      {forwardGeocodingAddresses.map((address, index) => (
        <SimpleActionDemo
          key={index}
          title={address}
          action={() => Location.geocodeAsync(address)}
        />
      ))}

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Reverse-Geocoding</Text>
      </View>
      {reverseGeocodingCoords.map((coords, index) => (
        <SimpleActionDemo
          key={index}
          title={`${coords.latitude}, ${coords.longitude}`}
          action={() => Location.reverseGeocodeAsync(coords)}
        />
      ))}
      <SimpleActionDemo
        title="Where am I?"
        action={async () => {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.LocationAccuracy.Lowest,
          });
          return Location.reverseGeocodeAsync(location.coords);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switch: {
    paddingTop: 10,
    paddingLeft: 10,
    justifyContent: 'flex-start',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 10,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 10,
    marginBottom: 0,
    marginTop: 30,
  },
  exampleText: {
    fontSize: 15,
    color: '#ccc',
    marginVertical: 10,
  },
  examplesContainer: {
    paddingTop: 15,
    paddingBottom: 5,
    paddingHorizontal: 20,
  },
  selectedExampleText: {
    color: 'black',
  },
  resultText: {
    padding: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  errorResultText: {
    padding: 20,
    color: 'red',
  },
  button: {
    ...Platform.select({
      android: {
        marginBottom: 10,
      },
    }),
  },
});
