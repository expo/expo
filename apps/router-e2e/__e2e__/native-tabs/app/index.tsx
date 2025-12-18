import { Link, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

export default function Index() {
  const navigation = useNavigation();
  useEffect(() => {
    // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
    return navigation.addListener('tabPress', (e) => {
      Alert.alert('Tab Pressed', e.target);
    });
  }, [navigation]);
  return (
    <ScrollView
      testID="native-tabs-index"
      style={{ flex: 1 }}
      contentContainerStyle={{
        justifyContent: 'center',
        // alignItems: 'center',
        padding: 32,
        gap: 16,
      }}>
      <Link href="/nested/inner">Go to /nested/inner</Link>
      <Link href="/nested">Go to /nested</Link>
      {Array.from({ length: 50 }).map((_, i) => (
        <Text key={i}>Item {i + 1}</Text>
      ))}
    </ScrollView>
  );
}
