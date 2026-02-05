import { getPermissionsAsync } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Alert, Button } from 'react-native';

import { Notifier } from '../Notifier';
import { ScrollView } from '../misc/Themed';

export default function IndexPage() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <Button title="Run on-device tests" onPress={() => router.push('/run')} />
      <Button
        title="Go to NCL NotificationScreen"
        onPress={() => router.push('/ncl-notification-screen')}
      />
      <Button title="Go to playground" onPress={() => router.push('/playground')} />
      <Button title="Go to test scenarios" onPress={() => router.push('/scenarios')} />
      <Button
        title="Get Notification permissions"
        onPress={() => {
          getPermissionsAsync()
            .then((permissions) => Alert.alert(JSON.stringify(permissions, null, 2)))
            .catch((error) => console.error(error));
        }}
      />
      <Notifier />
    </ScrollView>
  );
}
