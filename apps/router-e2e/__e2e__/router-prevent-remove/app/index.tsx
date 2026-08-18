import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Index() {
  return (
    <View>
      <Text testID="index">Index</Text>
      <Link href="/form-hook" asChild>
        <Pressable testID="open-hook">
          <Text>Hook form</Text>
        </Pressable>
      </Link>
      <Link href="/form-option" asChild>
        <Pressable testID="open-option">
          <Text>Router back form</Text>
        </Pressable>
      </Link>
    </View>
  );
}
