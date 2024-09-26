'use dom';

import { Image, View } from 'react-native';

export default function Page(_: { dom?: import('expo/dom').DOMProps }) {
  return (
    <View
      style={{
        width: '100%',
        height: 500,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#dcdcdc',
      }}>
      <Image source={require('../../../assets/icon.png')} style={{ width: 64, height: 64 }} />
    </View>
  );
}
