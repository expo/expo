import { Text, View } from "react-native";
import { Link, useLoader } from 'expo-router';

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

      <Link href="/">
        <Text>Back to Index</Text>
      </Link>
    </View>
  );
}
