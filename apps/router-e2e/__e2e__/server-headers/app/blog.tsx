import { Text, View } from 'react-native';

export async function loader() {
  return Response.json(
    { data: 'blog' },
    { headers: { 'Cache-Control': 'public, max-age=604800' } }
  );
}

export default function Blog() {
  return (
    <View>
      <Text>Blog</Text>
    </View>
  );
}
