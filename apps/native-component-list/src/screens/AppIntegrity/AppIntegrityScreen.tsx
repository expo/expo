import { View, Text, Platform } from 'react-native';

export default function AppIntegrityScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>AppIntegerity is not supported on {Platform.OS}</Text>
    </View>
  );
}
