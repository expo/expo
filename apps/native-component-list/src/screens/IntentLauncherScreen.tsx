import { View } from 'react-native';

import { BodyText } from '../components/BodyText';

export default function IntentLauncherScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <BodyText>IntentLauncherAndroid is only available on Android.</BodyText>
    </View>
  );
}

IntentLauncherScreen.navigationOptions = {
  title: 'IntentLauncher',
};
