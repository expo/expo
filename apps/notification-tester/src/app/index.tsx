import { useRouter } from 'expo-router';
import { Button } from 'react-native';

import { Notifier } from '../Notifier';
import { ScrollView } from '../misc/Themed';

export default function IndexPage() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <Button title="Run on-device tests" onPress={() => router.push('/run')} />
      <Button title="Go to notification playground" onPress={() => router.push('/utilities')} />
      <Button title="Go to test scenarios" onPress={() => router.push('/scenarios')} />
      <Notifier />
    </ScrollView>
  );
}
