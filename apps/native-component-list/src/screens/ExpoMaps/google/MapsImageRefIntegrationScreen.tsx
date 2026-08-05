import { useImage } from 'expo-image';
import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

const VANCOUVER = {
  latitude: 49.246292,
  longitude: -123.116226,
};

const VANCOUVER_SVG = {
  latitude: VANCOUVER.latitude + 0.01,
  longitude: VANCOUVER.longitude + 0.01,
};

export default function MapsImageRefIntegrationScreen() {
  const pngImage = useImage('https://picsum.photos/128', {
    onError(error) {
      console.error(error);
    },
  });

  // maxWidth/maxHeight control the rasterized resolution, without them the
  // SVG renders at its viewBox size (24x22 px here), which is too small to
  // see on a city-zoom map.
  const svgImage = useImage(require('../../../../assets/images/expo.svg'), {
    maxWidth: 128,
    maxHeight: 128,
    onError(error) {
      console.error(error);
    },
  });

  const markers = [
    ...(pngImage ? [{ title: 'PNG marker', coordinates: VANCOUVER, icon: pngImage }] : []),
    ...(svgImage ? [{ title: 'SVG marker', coordinates: VANCOUVER_SVG, icon: svgImage }] : []),
  ];

  return (
    <View style={{ flex: 1 }}>
      <GoogleMaps.View
        style={{ width: 'auto', height: '100%' }}
        cameraPosition={{
          zoom: 10,
          coordinates: VANCOUVER,
        }}
        markers={markers}
      />
    </View>
  );
}
