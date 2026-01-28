import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function BlogPost() {
  const { post } = useLocalSearchParams<{ post: string }>();
  return (
    <View>
      <Text testID="blog-post">Blog Post: {post}</Text>
    </View>
  );
}
