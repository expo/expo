import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import PreviewIndex from './(stack)/index';
import PeekAndPopNativeComponent from '@/specs/PeekAndPopNativeComponent';

export default function Index() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  useEffect(() => {
    setTimeout(() => {
      router.prefetch('/(stack)');
    }, 100);
  }, []);
  return (
    <>
      <Text>Index</Text>
      <Link href="/(stack)">/(stack)</Link>
      <Link href="/(tabs)">/(tabs)</Link>
      <View style={{ marginTop: 300, width: 100, height: 50 }}>
        <PeekAndPopNativeComponent style={{ width: 100, height: 50, marginLeft: 100 }} />
      </View>
    </>
  );
}
