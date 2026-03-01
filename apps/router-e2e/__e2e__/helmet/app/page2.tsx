import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { StyleSheet, View, Text, Pressable } from 'react-native';

export default function Page2Screen() {
  return (
    <View style={styles.container}>
      <Head>
        <title>Page 2</title>
      </Head>
      <Text testID="page2-text">Page 2</Text>
      <Link href="/" testID="page2-link-index">
        Go to Index
      </Link>
      <Link href="/page1" testID="page2-link-page1">
        Go to Page 1
      </Link>
      <Pressable testID="page2-button-index" onPress={() => router.push('/')}>
        <Text>Push Index</Text>
      </Pressable>
      <Pressable testID="page2-button-page1" onPress={() => router.push('/page1')}>
        <Text>Push Page 1</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
});
