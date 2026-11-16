import { useLoaderData } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

export async function loader() {
  return {
    rows: Array.from({ length: 400 }, (_, id) => ({
      id,
      label: `Row ${id} of 400, carrying enough text that a few hundred of them add up`,
    })),
  };
}

export default function LargeSuspenseRoute() {
  const { rows } = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <View testID="suspense-content">
      <Button testID="suspense-increment" title="Increment" onPress={() => setCount(count + 1)} />
      <Text testID="suspense-count">{count}</Text>
      {rows.map((row) => (
        <Text key={row.id} testID="suspense-row">
          {row.label}
        </Text>
      ))}
      <Text testID="suspense-content-end">End of loader rows</Text>
      {mounted && <Text testID="suspense-mounted">Mounted</Text>}
    </View>
  );
}
