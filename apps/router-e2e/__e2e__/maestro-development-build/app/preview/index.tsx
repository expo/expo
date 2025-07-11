import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';

export default function PreviewIndex() {
  return (
    <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
      <Text>Preview Index</Text>
      <Link href="/preview/one">
        <Link.Trigger>Link.Preview /one</Link.Trigger>
        <Link.Preview />
      </Link>
    </ScrollView>
  );
}
