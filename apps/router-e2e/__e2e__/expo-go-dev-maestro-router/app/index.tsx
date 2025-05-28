import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import PreviewIndex from './(stack)/index';

import PeekAndPopNativeComponent from '@/specs/PeekAndPopNativeComponent';
import PeekAndPopPreviewNativeComponent from '@/specs/PeekAndPopPreviewNativeComponent';
import PeekAndPopTriggerNativeComponent from '@/specs/PeekAndPopTriggerNativeComponent';

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
        <PeekAndPopNativeComponent
          style={{ width: 100, height: 50, marginLeft: 100 }}
          onPreviewTapped={() => {
            setTimeout(() => {
              router.navigate('/(stack)');
            }, 300);
          }}>
          <PeekAndPopTriggerNativeComponent>
            <Text>Trigger</Text>
          </PeekAndPopTriggerNativeComponent>
          <PeekAndPopPreviewNativeComponent>
            <View style={{ width, height }}>
              <PreviewIndex />
            </View>
          </PeekAndPopPreviewNativeComponent>
        </PeekAndPopNativeComponent>
      </View>
    </>
  );
}
