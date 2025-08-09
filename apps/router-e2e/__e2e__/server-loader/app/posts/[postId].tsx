import { Text, View } from "react-native";
import { useLoader } from "expo-router";

export async function generateStaticParams(params: {
  id: 'one' | 'two';
}): Promise<Record<string, string>[]> {
  return [
    {
      postId: 'foo',
    },
    {
      postId: 'bar',
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
    </View>
  );
}
