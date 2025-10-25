import { PlatformColor, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: PlatformColor('label'), fontSize: 24, fontWeight: 'bold' }}>
        Nothing is selected
      </Text>
    </View>
  );
}
