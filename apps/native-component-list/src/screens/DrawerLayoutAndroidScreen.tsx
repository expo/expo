import { View } from 'react-native';

import { BodyText } from '../components/BodyText';

export default function DrawerLayoutAndroidScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <BodyText>Only available on Android</BodyText>
    </View>
  );
}

DrawerLayoutAndroidScreen.navigationOptions = {
  title: 'DrawerLayoutAndroid',
};
