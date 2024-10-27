import { Image } from 'expo-image';
import { Text, View, StyleSheet } from 'react-native';

export default function ImageLocalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Load image from native asset directories</Text>
      <Image source="image1" contentFit="cover" style={styles.image} />
      <Image source="image2" contentFit="cover" style={styles.image} />
      <Image
        source="image3"
        contentFit="cover"
        transition={{ duration: 2000, effect: 'curl-down' }}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    padding: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
});
