import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { StyleSheet, View, Text, Pressable } from 'react-native';

export default function Page1Screen() {
  return (
    <View style={styles.container}>
      <Head>
        <title>Page 1</title>
      </Head>
      <Text testID="page1-text">Page 1</Text>
      <Link href="/" testID="page1-link-index">
        Go to Index
      </Link>
      <Link href="/page2" testID="page1-link-page2">
        Go to Page 2
      </Link>
      <Pressable testID="page1-button-index" onPress={() => router.push('/')}>
        <Text>Push Index</Text>
      </Pressable>
      <Pressable testID="page1-button-page2" onPress={() => router.push('/page2')}>
        <Text>Push Page 2</Text>
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
