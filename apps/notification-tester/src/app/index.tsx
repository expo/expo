import { useRouter } from 'expo-router';
import { Button } from 'react-native';

import { Notifier } from '../Notifier';
import { ScrollView } from '../Themed';

export default function Page() {
  const router = useRouter();
  return (
    <ScrollView>
      <Button title="go to notification utils" onPress={() => router.push('/utilities')} />
      <Notifier />
    </ScrollView>
  );
}
