import { Link } from 'expo-router';
import { Image, ScrollView, View } from 'react-native';

export default function ZoomDestScreen() {
  return (
    <ScrollView style={{ flex: 1 }}>
      <Link.AppleZoomTarget>
        <View style={{ width: '100%', aspectRatio: 1 }}>
          <Image
            source={require('../../../assets/frog.jpg')}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </Link.AppleZoomTarget>
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <Image
          src="https://picsum.photos/seed/1/800/600"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <Image
          src="https://picsum.photos/seed/2/800/600"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </ScrollView>
  );
}
