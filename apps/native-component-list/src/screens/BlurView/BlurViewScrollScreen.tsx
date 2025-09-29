import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurTargetView, BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

function TouchableIcon({ name }: { name: 'home' | 'heart' | 'gear' }) {
  return (
    <TouchableOpacity>
      <FontAwesome name={name} size={48} color="rgba(255, 255, 255, 0.85)" />
    </TouchableOpacity>
  );
}

export default function BlurScrollScreen() {
  const images = [
    require('../../../assets/images/example1.jpg'),
    require('../../../assets/images/example2.jpg'),
    require('../../../assets/images/example3.jpg'),
    require('../../../assets/images/chapeau.png'),
  ];
  const blurTargetRef = useRef<View | null>(null);

  return (
    <View style={styles.container}>
      <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
        <FlatList
          data={Array(100).fill(images).flat()}
          renderItem={({ item }) => {
            return (
              <View>
                <Image source={item} style={styles.image} contentFit="cover" />
              </View>
            );
          }}
          keyExtractor={(_, index) => {
            return `${index}`;
          }}
        />
      </BlurTargetView>
      <View style={styles.overlayContainer}>
        <BlurView
          style={styles.overlay}
          blurTarget={blurTargetRef}
          blurMethod="dimezisBlurView"
          intensity={40}>
          <TouchableIcon name="home" />
          <TouchableIcon name="heart" />
          <TouchableIcon name="gear" />
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, maxWidth: 800, alignSelf: 'center', width: '100%' },
  overlayContainer: {
    position: 'absolute',
    width: '100%',
    height: 100,
    bottom: 20,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    alignItems: 'center',
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'white',
  },
  blurTarget: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
});
