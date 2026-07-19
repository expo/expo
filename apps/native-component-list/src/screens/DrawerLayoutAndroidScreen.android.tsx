import * as React from 'react';
import { DrawerLayoutAndroid, View, Platform } from 'react-native';

import { BodyText } from '../components/BodyText';
import TitleSwitch from '../components/TitledSwitch';

export default function DrawerLayoutAndroidScreen() {
  const [isRight, setRight] = React.useState(false);

  const renderNavigationView = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <BodyText>DrawerLayoutAndroid</BodyText>
    </View>
  );

  return Platform.OS === 'android' ? (
    <DrawerLayoutAndroid
      drawerWidth={300}
      drawerPosition={isRight ? 'right' : 'left'}
      renderNavigationView={renderNavigationView}>
      <View style={{ flex: 1, padding: 16 }}>
        <TitleSwitch title="Is Right" value={isRight} setValue={setRight} />
        <BodyText>Pull from the {isRight ? 'right' : 'left'}</BodyText>
      </View>
    </DrawerLayoutAndroid>
  ) : (
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
