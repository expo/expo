import { Text, View } from "react-native";
import { Link, useLoaderData, useLocalSearchParams, usePathname, useSegments } from 'expo-router';

export async function generateStaticParams(params: {
  id: 'one' | 'two';
}): Promise<Record<string, string>[]> {
  return [
    {
      postId: 'static-post-1',
    },
    {
      postId: 'static-post-2',
    },
  ];
}

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

      <Link href="/">
        <Text>Go to Index</Text>
      </Link>
      <Link href="/second">
        <Text>Go to Second</Text>
      </Link>
    </View>
  );
}
