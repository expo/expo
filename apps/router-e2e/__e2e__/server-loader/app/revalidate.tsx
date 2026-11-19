import { useLoaderData, useLoaderRevalidator } from 'expo-router';
import { Activity, useEffect, useState } from 'react';
import { Button, Text, TextInput } from 'react-native';

export function loader() {
  return Response.json(
    { revision: Math.random() },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}

export default function RevalidateRoute() {
  const { revalidate, isPending } = useLoaderRevalidator();
  const [hidden, setHidden] = useState(false);
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <Text testID="refresh-mounted">{String(mounted)}</Text>
      <TextInput testID="refresh-input" value={text} onChangeText={setText} />
      <Text testID="refresh-pending">{String(isPending)}</Text>
      <Button testID="refresh-button" title="Refresh" onPress={revalidate} />
      <Button testID="refresh-toggle" title="Toggle" onPress={() => setHidden(!hidden)} />
      <Activity mode={hidden ? 'hidden' : 'visible'}>
        <Reader />
      </Activity>
    </>
  );
}

function Reader() {
  return <Text testID="refresh-data">{JSON.stringify(useLoaderData<typeof loader>())}</Text>;
}
