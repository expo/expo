import { useRouter } from 'expo-router';
import { Button, Text } from 'react-native';

import { ScrollView } from '../misc/Themed';
import { setAppNotificationHandler } from '../registerTaskAsync';

export default function IndexPage() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <Button title="Run on-device tests" onPress={() => router.push('/run')} />
      <Text>Runs the tests before this app sets a notification handler.</Text>
      <Button
        title="Open the tester app"
        onPress={() => {
          setAppNotificationHandler();
          router.push('/tester');
        }}
      />
      <Text>Sets the notification handler of this app, then opens it.</Text>
    </ScrollView>
  );
}
