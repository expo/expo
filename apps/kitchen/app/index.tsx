import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Head } from '../components/head';

import { getPackages } from '../data/libs';

export default function Page() {
  const pkgs = getPackages();
  return (
    <View style={styles.container}>
      <Head>
        <title>Kitchen</title>
      </Head>
      <View style={styles.main}>
        {pkgs.map((library) => (
          <Link
            key={library}
            href={{
              pathname: '/api/[library]',
              params: {
                library,
              },
            }}
            asChild>
            <Pressable>
              {({ hovered }) => (
                <Text
                  style={[
                    styles.title,
                    hovered && { color: 'blue', textDecorationLine: 'underline' },
                  ]}>
                  {library}
                </Text>
              )}
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 960,
    marginHorizontal: 'auto',
  },
  title: {
    fontSize: 36,
  },
  subtitle: {
    fontSize: 36,
    color: '#38434D',
  },
});
