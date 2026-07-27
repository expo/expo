import { Text, View } from 'react-native';

export async function loader() {
  return { data: 'blog' };
}

export default function Blog() {
  return (
    <View>
      <Text>Blog</Text>
    </View>
  );
}
