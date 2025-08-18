import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import { ScrollView, Text } from 'react-native';

export default function Index() {
  const { title } = useLocalSearchParams();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{
        padding: 32,
        gap: 16,
        width: '100%',
      }}>
      <Stack.Screen options={{ title }} />
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
        This is single news page for {title}
      </Text>
    </ScrollView>
  );
}
