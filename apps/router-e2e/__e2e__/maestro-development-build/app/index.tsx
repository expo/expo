import { Link } from 'expo-router';
import { ScrollView } from 'react-native';

export default function Index() {
  return (
    <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
      <Link href="/preview">Link Preview</Link>
    </ScrollView>
  );
}
