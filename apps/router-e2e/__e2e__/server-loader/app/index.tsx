import { Text, View } from "react-native";
import { Link, useLoader } from 'expo-router';

export async function loader({ params }) {
  return Promise.resolve({
    params,
  });
}

export default function Index() {
  const data = useLoader(loader);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text testID="loader-result">{JSON.stringify(data)}</Text>

      <Link href="/posts/static-post-1">
        <Text>Go to static Post 1</Text>
      </Link>
      <Link href="/posts/static-post-2">
        <Text>Go to static Post 2</Text>
      </Link>
      <Link href="/posts/dynamic-post-1">
        <Text>Go to dynamic Post 1</Text>
      </Link>
      <Link href="/posts/dynamic-post-2">
        <Text>Go to dynamic Post 2</Text>
      </Link>
      <Link href="/posts/error">
        <Text>Go to error Post 1</Text>
      </Link>
    </View>
  );
}
