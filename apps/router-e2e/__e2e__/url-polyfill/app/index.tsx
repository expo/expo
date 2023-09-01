import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Page() {
  useEffect(() => {
    fetch('/hello.json', {})
      .then((res) => res.json())
      .then(console.log);
  }, []);
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: (typeof location !== 'undefined' ? location.origin : '') + '/snack.png' }}
        style={{ width: 250, height: 250, backgroundColor: 'blue' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
});
