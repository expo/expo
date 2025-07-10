import { Image } from 'expo-image';
import { useRef, useState, useCallback } from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const expoImageRef = useRef<Image>(null);

  const handleGifPlayback = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      await expoImageRef.current?.stopAnimating();
      return;
    }
    setIsPlaying(true);
    await expoImageRef.current?.startAnimating();
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <Image
        ref={expoImageRef}
        style={{ width: 300, height: 300 }}
        source={{
          uri: 'https://mir-s3-cdn-cf.behance.net/project_modules/source/5eeea355389655.59822ff824b72.gif',
        }}
        autoplay={false}
      />
      <TouchableOpacity style={styles.button} onPress={handleGifPlayback}>
        <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    width: '40%',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
