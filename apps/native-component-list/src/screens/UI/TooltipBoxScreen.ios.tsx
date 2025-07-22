import { View, Text } from 'react-native';

export default function TooltipBoxScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ textAlign: 'center' }}>Not implemented on iOS.</Text>
    </View>
  );
}

TooltipBoxScreen.navigationOptions = {
  title: 'TooltipBox',
};
