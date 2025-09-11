import { View, Text } from 'react-native';

export const UIScreens = [];

export default function UIScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Expo UI is only available on Android and iOS currently.</Text>
    </View>
  );
}

UIScreen.navigationOptions = {
  title: 'Expo UI',
};
