import { Text, View } from 'react-native';

export default function DrawerLayoutAndroidScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>Only available on Android</Text>
    </View>
  );
}

DrawerLayoutAndroidScreen.navigationOptions = {
  title: 'DrawerLayoutAndroid',
};
