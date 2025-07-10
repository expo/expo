import { View, Text } from 'react-native';

export default function JetpackComposePrimitivesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ textAlign: 'center' }}>Not implemented on iOS, as you might expect.</Text>
    </View>
  );
}

JetpackComposePrimitivesScreen.navigationOptions = {
  title: 'Jetpack Compose primitives',
};
