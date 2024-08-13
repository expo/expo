import 'server-only';
import { View, Image, Text, Button } from '../lib/react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Text testID="main-text">Hey RSC</Text>
      {/* local Metro asset */}
      <Image
        testID="main-image"
        source={require('../../../assets/icon.png')}
        style={{ width: 100, height: 100 }}
      />

      <Button title="Button" />
    </View>
  );
}
