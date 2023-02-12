import * as React from 'react';
import { DrawerLayoutAndroid, Text, View, Platform } from 'react-native';

import TitleSwitch from '../components/TitledSwitch';

export default function DrawerLayoutAndroidScreen() {
  const [isRight, setRight] = React.useState(false);

  const renderNavigationView = () => (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text>DrawerLayoutAndroid</Text>
    </View>
  );

  return Platform.OS === 'android' ? (
    <DrawerLayoutAndroid
      drawerWidth={300}
      drawerPosition={isRight ? 'right' : 'left'}
      renderNavigationView={renderNavigationView}>
      <View style={{ flex: 1, padding: 16 }}>
        <TitleSwitch title="Is Right" value={isRight} setValue={setRight} />
        <Text>Pull from the {isRight ? 'right' : 'left'}</Text>
      </View>
    </DrawerLayoutAndroid>
  ) : (
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
