import { Text, View } from "react-native";
import { Link, useLoaderData, useLocalSearchParams, usePathname, useSegments } from 'expo-router';

export async function loader({ params }) {
  return Promise.resolve({
    params,
  });
}

export default function Index() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const segments = useSegments();
  const data = useLoaderData(loader);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text testID="pathname-result">{JSON.stringify(pathname)}</Text>
      <Text testID="localparams-result">{JSON.stringify(localParams)}</Text>
      <Text testID="segments-result">{JSON.stringify(segments)}</Text>
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
