import { Suspense, use, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

const clientResource = new Promise<string>(() => {});

function createResource(delay: number) {
  // Only the server can provide this content, so client rendering cannot hide lost server DOM.
  return typeof window === 'undefined'
    ? new Promise<string>((resolve) => setTimeout(() => resolve('Streamed content'), delay))
    : clientResource;
}

function Content({ resource, id }: { resource: Promise<string>; id: string }) {
  return (
    <Text nativeID={id} style={styles.text}>
      {use(resource)}
    </Text>
  );
}

function Shell() {
  const [mounted, setMounted] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Text testID="hydration-status" style={styles.text}>
        {mounted ? 'mounted' : 'unmounted'}
      </Text>
      <Text testID="click-status" style={styles.text}>
        {clicked ? 'clicked' : 'unclicked'}
      </Text>
      <Pressable nativeID="shell" onPress={() => setClicked(true)}>
        <Text style={styles.text}>Interactive shell</Text>
      </Pressable>
    </>
  );
}

/** Native stand-in for the web page. The streaming assertions only run on web. */
export default function SafeAreaStreamingPage() {
  const [resources] = useState(() => [createResource(5000), createResource(7000)]);

  return (
    <View style={styles.content}>
      <Shell />
      <View>
        <Suspense
          fallback={
            <Text nativeID="first-fallback" style={styles.text}>
              First pending
            </Text>
          }>
          <Content id="first" resource={resources[0]} />
        </Suspense>
        <Suspense
          fallback={
            <Text nativeID="second-fallback" style={styles.text}>
              Second pending
            </Text>
          }>
          <Content id="second" resource={resources[1]} />
        </Suspense>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  text: {
    color: colors.text,
  },
});
