import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Image
        placeholder={require('./assets/images/expo.svg')}
        placeholderContentFit="contain"
        style={styles.image}
        tintColor="red"
      />
      <Image
        source={require('./assets/images/expo.svg')}
        contentFit="scale-down"
        style={styles.image}
        tintColor="red"
      />
      <Image source={require('./assets/images/user.png')} style={styles.image} tintColor="yellow" />
      <Image source={require('./assets/icons/icon.png')} style={styles.image} tintColor="cyan" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: 'brown',
  },
});
