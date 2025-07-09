'use dom';
import { router, Link, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, any>;
  dom?: import('expo/dom').DOMProps;
}) {
  const r = useRouter();

  return (
    <View style={{ gap: 8 }}>
      <Text>Params: {JSON.stringify(searchParams)}</Text>
      <Link href="/second">{`<Link />`}</Link>
      <Link href="/second" push>{`<Link push />`}</Link>
      <Link href="/second" relativeToDirectory>{`<Link relativeToDirectory />`}</Link>

      <Text
        onPress={() => {
          router.navigate('/second');
        }}>
        {`router.navigate()`}
      </Text>
      <Text
        onPress={() => {
          r.replace('/second');
        }}>
        {`useRouter().replace()`}
      </Text>
      <Text
        onPress={() => {
          r.navigate('/second');
        }}>
        {`useRouter().navigate()`}
      </Text>
      <Text onPress={() => router.replace('/?a=' + Date.now())}>{`router.replace()`}</Text>
      <Text onPress={() => router.back()}>{`router.back()`}</Text>
      <Text onPress={() => router.dismiss()}>{`router.dismiss()`}</Text>
      <Text onPress={() => router.dismissAll()}>{`router.dismissAll()`}</Text>
      <Text onPress={() => router.push('/')}>{`router.push()`}</Text>
      <Text onPress={() => router.setParams({ foo: Math.random() })}>{`router.setParams()`}</Text>
    </View>
  );
}
