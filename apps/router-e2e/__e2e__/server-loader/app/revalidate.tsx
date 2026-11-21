import { useLoaderData, useLoaderRevalidator, useLocalSearchParams } from 'expo-router';
import { fetchLoader } from 'expo-router/build/loaders/utils';
import { Activity, useEffect, useState } from 'react';
import { Button, Text, TextInput } from 'react-native';

export function loader(request?: Request) {
  return Response.json(
    { revision: Math.random(), requestCacheControl: request?.headers.get('Cache-Control') ?? null },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}

export default function RevalidateRoute() {
  const { revalidate, isPending } = useLoaderRevalidator();
  const { run } = useLocalSearchParams<{ run?: string }>();
  const [cachedRead, setCachedRead] = useState<unknown>();
  const [hidden, setHidden] = useState(false);
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <Text style={{ color: 'white' }} testID="refresh-mounted">
        {String(mounted)}
      </Text>
      <TextInput
        style={{ color: 'white', borderColor: 'white', borderWidth: 1, minWidth: 200 }}
        testID="refresh-input"
        value={text}
        onChangeText={setText}
      />
      <Text style={{ color: 'white' }} testID="refresh-pending">
        {String(isPending)}
      </Text>
      <Button testID="refresh-button" title="Refresh" onPress={revalidate} />
      <Button testID="refresh-toggle" title="Toggle" onPress={() => setHidden(!hidden)} />
      <Button
        testID="refresh-cache-probe"
        title="Read cached response"
        onPress={async () => {
          const path = run ? `/revalidate?run=${encodeURIComponent(run)}` : '/revalidate';
          setCachedRead(await fetchLoader(path));
        }}
      />
      <Text style={{ color: 'white' }} testID="refresh-cached-data">
        {JSON.stringify(cachedRead)}
      </Text>
      <Activity mode={hidden ? 'hidden' : 'visible'}>
        <Reader />
      </Activity>
    </>
  );
}

function Reader() {
  return (
    <Text style={{ color: 'white' }} testID="refresh-data">
      {JSON.stringify(useLoaderData<typeof loader>())}
    </Text>
  );
}
