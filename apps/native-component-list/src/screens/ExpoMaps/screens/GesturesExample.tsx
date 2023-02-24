import * as Maps from 'expo-maps';
import React, { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import SwitchContainer from '../components/SwitchContainer';
import ProviderContext from '../context/ProviderContext';

export default function GesturesExample() {
  const provider = useContext(ProviderContext);

  const [enableRotateGestures, setEnableRotateGestures] = useState<boolean>(false);
  const [enableScrollGestures, setEnableScrollGestures] = useState<boolean>(false);
  const [enableTiltGestures, setEnableTiltGestures] = useState<boolean>(false);
  const [enableZoomGestures, setEnableZoomGestures] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider={provider}
        enableRotateGestures={enableRotateGestures}
        enableScrollGestures={enableScrollGestures}
        enableTiltGestures={enableTiltGestures}
        enableZoomGestures={enableZoomGestures}
      />
      <View style={{ padding: 20 }}>
        <SwitchContainer
          title="Enable rotate gestures"
          value={enableRotateGestures}
          onValueChange={() => setEnableRotateGestures(!enableRotateGestures)}
        />
        <SwitchContainer
          title="Enable scroll gestures"
          value={enableScrollGestures}
          onValueChange={() => setEnableScrollGestures(!enableScrollGestures)}
        />
        <SwitchContainer
          title="Enable tilt gestures"
          value={enableTiltGestures}
          onValueChange={() => setEnableTiltGestures(!enableTiltGestures)}
        />
        <SwitchContainer
          title="Enable zoom gestures"
          value={enableZoomGestures}
          onValueChange={() => setEnableZoomGestures(!enableZoomGestures)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switchContainer: {
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
