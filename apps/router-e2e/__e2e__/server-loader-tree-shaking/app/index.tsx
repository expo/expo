import { useLoaderData } from 'expo-router';
import { Suspense, useState } from 'react';
import { Button, Text, View } from 'react-native';

import { readServerData } from '../server/data';

function readData() {
  return readServerData();
}

export async function loader() {
  return readData();
}

function Screen() {
  const data = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);
  return (
    <View>
      <Text testID="loader-result">{data.message}</Text>
      <Text testID="count">{count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
}

export default function Route() {
  return (
    <Suspense>
      <Screen />
    </Suspense>
  );
}
