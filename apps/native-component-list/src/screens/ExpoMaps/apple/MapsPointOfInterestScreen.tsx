import { AppleMaps } from 'expo-maps';
import {
  AppleMapPointOfInterestCategory,
  AppleMapsPointOfInterestCategories,
} from 'expo-maps/build/apple/AppleMaps.types';
import React, { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

const includingSome: AppleMapsPointOfInterestCategories = {
  including: [
    AppleMapPointOfInterestCategory.RESTAURANT,
    AppleMapPointOfInterestCategory.CAFE,
    AppleMapPointOfInterestCategory.HOTEL,
    AppleMapPointOfInterestCategory.MUSEUM,
    AppleMapPointOfInterestCategory.PARK,
  ],
};

const excludingSome: AppleMapsPointOfInterestCategories = {
  excluding: [AppleMapPointOfInterestCategory.RESTAURANT, AppleMapPointOfInterestCategory.CAFE],
};
const all: AppleMapsPointOfInterestCategories = { excluding: [] };
const none: AppleMapsPointOfInterestCategories = { including: [] };

export default function MapsPointOfInterestScreen() {
  const [pointsOfInterest, setPointsOfInterest] = useState<
    AppleMapsPointOfInterestCategories | undefined
  >(includingSome);

  return (
    <View style={styles.container}>
      <AppleMaps.View
        style={{ width: 'auto', height: '100%' }}
        properties={{
          pointsOfInterest,
        }}
        cameraPosition={{
          coordinates: {
            latitude: 37.78825,
            longitude: -122.4324,
          },
          zoom: 15,
        }}
      />
      <View style={styles.controls}>
        <View style={styles.buttonContainer}>
          <Button
            title="Include: Food, Hotels, Parks"
            onPress={() => setPointsOfInterest(includingSome)}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Exclude: Restaurants, Cafes"
            onPress={() => setPointsOfInterest(excludingSome)}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Show All POIs" onPress={() => setPointsOfInterest(all)} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Hide All POIs" onPress={() => setPointsOfInterest(none)} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Default (undefined)" onPress={() => setPointsOfInterest(undefined)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 10,
    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
  },
  buttonContainer: {
    marginVertical: 4,
  },
});
