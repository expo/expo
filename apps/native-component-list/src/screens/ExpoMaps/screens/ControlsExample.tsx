import * as Maps from 'expo-maps';
import { Platform } from 'expo-modules-core';
import React, { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import SwitchContainer from '../components/SwitchContainer';
import ProviderContext from '../context/ProviderContext';

export default function ControlsExample() {
  const provider = useContext(ProviderContext);

  const [showZoomControls, setShowZoomControls] = useState<boolean>(false);
  const [showCompass, setShowCompass] = useState<boolean>(false);
  const [showMyLocationButton, setShowMyLocationButton] = useState<boolean>(false);
  const [showLevelPicker, setShowLevelPicker] = useState<boolean>(false);
  const [showMapToolbar, setShowMapToolbar] = useState<boolean>(false);

  return (
    <View style={styles.mapContainer}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider={provider}
        showZoomControls={showZoomControls}
        showCompass={showCompass}
        showMyLocationButton={showMyLocationButton}
        showLevelPicker={showLevelPicker}
        showMapToolbar={showMapToolbar}
        enableRotateGestures
      />
      <View style={{ padding: 20 }}>
        {Platform.OS === 'android' && (
          <SwitchContainer
            title="Show zoom controls"
            value={showZoomControls}
            onValueChange={() => setShowZoomControls(!showZoomControls)}
          />
        )}
        <SwitchContainer
          title="Show compass"
          value={showCompass}
          onValueChange={() => setShowCompass(!showCompass)}
        />
        <SwitchContainer
          title="Show my location button"
          value={showMyLocationButton}
          onValueChange={() => setShowMyLocationButton(!showMyLocationButton)}
        />
        <SwitchContainer
          title="Show level picker"
          value={showLevelPicker}
          onValueChange={() => setShowLevelPicker(!showLevelPicker)}
        />
        {Platform.OS === 'android' && (
          <SwitchContainer
            title="Show map toolbar"
            value={showMapToolbar}
            onValueChange={() => setShowMapToolbar(!showMapToolbar)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
});
