import { AppleMaps } from 'expo-maps';
import { useRef } from 'react';
import { Button, View } from 'react-native';

export default function MapsCameraControlsScreen() {
  const ref = useRef<AppleMaps>(null);

  return (
    <View style={{ flex: 1 }}>
      <Button
        title="Animate to London"
        onPress={() => {
          ref.current?.setCameraPosition(2);
        }}
      />
      <AppleMaps.View
        ref={ref}
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          coordinates: {
            latitude: 51.509865,
            longitude: -0.1275,
          },
          zoom: 1,
        }}
      />
    </View>
  );
}
