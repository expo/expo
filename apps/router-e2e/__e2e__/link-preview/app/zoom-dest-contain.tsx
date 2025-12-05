import { Link } from 'expo-router';
import { Image, View } from 'react-native';

export default function ZoomDestScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Link.AppleZoomTarget>
        <View style={{ width: '100%', aspectRatio: 1 }}>
          <Image
            source={require('../../../assets/frog.jpg')}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </Link.AppleZoomTarget>
    </View>
  );
}
