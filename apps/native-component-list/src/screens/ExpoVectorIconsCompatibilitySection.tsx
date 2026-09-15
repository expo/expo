import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View } from 'react-native';

import { Section } from '../components/Page';

// Keep all legacy @expo/vector-icons usage isolated here. To remove compatibility coverage,
// delete this file, its single usage in FontScreen, and the package dependency.
export function ExpoVectorIconsCompatibilitySection({ color }: { color: string }) {
  return (
    <Section title="@expo/vector-icons compatibility">
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <FontAwesome name="camera" size={25} color={color} />
        <FontAwesome name="map" size={25} color={color} />
        <FontAwesome name="github" size={25} color={color} />
      </View>
    </Section>
  );
}
