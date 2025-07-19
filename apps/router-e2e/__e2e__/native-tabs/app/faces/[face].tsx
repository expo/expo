import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

export default function Index() {
  const { face } = useLocalSearchParams();
  return (
    <>
      <Stack.Screen options={{ title: `#${face}` }} />
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: `#${face}`,
        }}
        contentContainerStyle={{
          height: '150%',
        }}
        contentInsetAdjustmentBehavior="automatic">
        <Link href="/404" style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>
          Try and go to 404
        </Link>
      </ScrollView>
    </>
  );
}
