import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

export default function App() {
  const isFabricEnabled = global.nativeFabricUIManager != null;
  const [reverse, setReverse] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={[styles.text, { marginVertical: 64 }]}>
          isFabricEnabled: {isFabricEnabled + ''}
        </Text>
        <Button
          title="toggle linear gradient style"
          onPress={() => {
            setReverse(!reverse);
          }}
        />
        <LinearGradient
          style={styles.gradient}
          colors={reverse ? ['yellow', 'blue'] : ['blue', 'yellow']}
          end={reverse ? { x: 1.0, y: 0.5 } : { x: 0.5, y: 1.0 }}
        />
        <BlueExample />
      </ScrollView>
    </SafeAreaView>
  );
}

export function BlueExample() {
  const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';
  const text = 'Hello, my container is blurring contents underneath!';

  return (
    <View style={styles.blurExample}>
      <Image style={[StyleSheet.absoluteFill, styles.image]} source={{ uri }} />
      <BlurView intensity={100} style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <Text style={styles.text}>{text}</Text>
      </BlurView>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <Text style={[styles.text, { color: '#fff' }]}>{text}</Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  gradient: {
    width: 400,
    height: 200,
  },
  blurExample: {
    height: 640,
    marginTop: 64,
    flexDirection: 'column',
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
