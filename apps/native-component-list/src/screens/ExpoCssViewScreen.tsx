import { Image } from 'expo-image';
import { ExpoCssView } from 'modules/expo-css-view';
import { View, Text } from 'react-native';

export default function ExpoCssViewScreen() {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#000', gap: 20 }}>
      <Image
        source={{
          uri: 'https://plus.unsplash.com/premium_photo-1752551500520-9fe123115c6b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <ExpoCssView
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: 120,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          filter: [{ blur: 8 }],
        }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Filter: Blur</Text>
      </ExpoCssView>
      <ExpoCssView
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: 120,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: [{ blur: 15 }],
        }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
          Backdrop Filter: Blur
        </Text>
      </ExpoCssView>
      <ExpoCssView
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          height: 120,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: [{ grayscale: 1 }],
        }}
      />
    </View>
  );
}
