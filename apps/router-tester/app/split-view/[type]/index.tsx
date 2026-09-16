import { PlatformColor, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ color: PlatformColor('label'), fontSize: 24, fontWeight: 'bold' }}>
        Nothing is selected
      </Text>
    </View>
  );
}
