import { Link, router } from 'expo-router';
import Head from 'expo-router/head';
import { StyleSheet, View, Text, Pressable } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Head>
        <title>Index</title>
      </Head>
      <Text testID="index-text">Index Page</Text>
      <Link href="/page1" testID="index-link-page1">
        Go to Page 1
      </Link>
      <Link href="/page2" testID="index-link-page2">
        Go to Page 2
      </Link>
      <Pressable testID="index-button-page1" onPress={() => router.push('/page1')}>
        <Text>Push Page 1</Text>
      </Pressable>
      <Pressable testID="index-button-page2" onPress={() => router.push('/page2')}>
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
