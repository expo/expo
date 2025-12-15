import { Platform, Text, View } from 'react-native';

export default function GlassViewScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>GlassView is not supported on {Platform.OS}</Text>
    </View>
  );
}
