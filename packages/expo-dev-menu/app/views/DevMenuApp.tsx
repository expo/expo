import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StyleSheet, View, useColorScheme, Platform } from 'react-native';

import { loadFontsAsync } from '../DevMenuInternal';
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
  const [fontsWereLoaded, didFontsLoad] = useState(false);

  useEffect(() => {
    const f = async () => {
      if (Platform.OS !== 'android') {
        await loadFontsAsync();
      }
      didFontsLoad(true);
    };

    f();
  }, []);

  if (!fontsWereLoaded) {
    return <></>;
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
