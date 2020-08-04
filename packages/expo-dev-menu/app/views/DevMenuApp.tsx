import React from 'react';
import { useFonts } from 'expo-font';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';

import Colors from '../constants/Colors';
import DevMenuContainer from './DevMenuContainer';

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
    card: Colors.light.secondaryBackground,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
    card: Colors.dark.secondaryBackground,
  },
};

function DevMenuApp(props) {
  const colorScheme = useColorScheme();

  // @tsapeta: For production bundles probably the best way to use custom fonts is to just download them from web.
  // But maybe we should have it as an asset?
  const [fontsLoaded] = useFonts({
    'material-community':
      'https://github.com/Templarian/MaterialDesign-Font/raw/master/MaterialDesignIconsDesktop.ttf',
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.rootView}>
      <NavigationContainer theme={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <DevMenuContainer {...props} />
      </NavigationContainer>
    </View>
  );
}

export default class DevMenuAppRoot extends React.PureComponent<any, any> {
  render() {
    return <DevMenuApp {...this.props} />;
  }
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});
