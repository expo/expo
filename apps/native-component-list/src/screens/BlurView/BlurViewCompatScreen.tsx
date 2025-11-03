import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { View, StyleSheet, Text } from 'react-native';

export default function BlurViewCompatScreen() {
  const backgroundImage = require('../../../assets/images/example1.jpg');

  return (
    <View style={styles.container}>
      <Image source={backgroundImage} contentFit="cover" style={styles.image} />
      <BlurView style={styles.blurView} blurMethod="dimezisBlurView" intensity={100}>
        <Text style={styles.text}>
          On iOS and Web the content behind this container should be blurred, but on Android the
          container background should only be semi-transparent without aby blur, because the
          BlurTarget was not set.
        </Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  image: {
    flex: 1,
    alignSelf: 'stretch',
  },
  blurView: {
    position: 'absolute',
    width: 300,
    aspectRatio: 1,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'white',
    alignContent: 'center',
    justifyContent: 'center',
    padding: 30,
    overflow: 'hidden',
  },
  text: {
    textAlign: 'justify',
    color: 'white',
  },
});
