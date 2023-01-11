import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getPackages } from '../data/libs';

export default function Page() {
  const pkgs = getPackages();
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        {pkgs.map((library) => (
          <Link
            href={{
              pathname: '/api/[library]',
              params: {
                library,
              },
            }}>
            <Text style={styles.title}>{library}</Text>
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
    fontSize: 64,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 36,
    color: '#38434D',
  },
});
