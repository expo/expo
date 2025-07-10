import { Link, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeTwo() {
  const { time } = useLocalSearchParams();
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: top }}>
      <Text>Time: {time}</Text>
      <Link href="/(tabs)/home/slot/one">
        <Link.Trigger>Link.Preview: /(tabs)/home/slot/one</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
}
