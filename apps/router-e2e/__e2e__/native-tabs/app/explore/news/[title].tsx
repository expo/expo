import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import { ScrollView, Text } from 'react-native';

export default function Index() {
  const { title } = useLocalSearchParams();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 32,
        gap: 16,
        width: '100%',
      }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        This is single news page for {title}
      </Text>
    </ScrollView>
  );
}
