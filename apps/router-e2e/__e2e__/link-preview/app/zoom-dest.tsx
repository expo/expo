import { Image, View } from 'react-native';

export default function ZoomDestScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('../../../assets/frog.jpg')}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
