import { Text, View } from 'react-native';

export default function IntentLauncherScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>IntentLauncherAndroid is only available on Android.</Text>
    </View>
  );
}

IntentLauncherScreen.navigationOptions = {
  title: 'IntentLauncher',
};
