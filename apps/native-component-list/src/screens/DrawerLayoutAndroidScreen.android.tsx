import * as React from 'react';
import { DrawerLayoutAndroid, StyleSheet, Text, View } from 'react-native';

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

  return (
    <DrawerLayoutAndroid
      drawerWidth={300}
      // @ts-ignore
      drawerPosition={isRight ? 'right' : 'left'}
      renderNavigationView={renderNavigationView}>
      <View style={{ flex: 1, padding: 16 }}>
        <TitleSwitch title="Is Right" value={isRight} setValue={setRight} />
        <Text>Pull from the {isRight ? 'right' : 'left'}</Text>
      </View>
    </DrawerLayoutAndroid>
  );
}

DrawerLayoutAndroidScreen.navigationOptions = {
  title: 'DrawerLayoutAndroid',
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
    flex: 1,
    maxHeight: 300,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  item: {
    margin: 5,
    padding: 8,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
    maxHeight: 96,
  },
});
