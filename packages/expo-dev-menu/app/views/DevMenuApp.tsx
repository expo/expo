import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { loadFontsAsync, onScreenChangeAsync } from '../DevMenuInternal';
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
  const routeNameRef = useRef<string>();
  const navigationRef = useRef();

  useEffect(() => {
    const loadFonts = async () => {
      await loadFontsAsync();
      didFontsLoad(true);
    };

    loadFonts();
  }, []);

  if (!fontsWereLoaded) {
    return <></>;
  }

  return (
    <View style={styles.rootView}>
      <NavigationContainer
        theme={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}
        ref={navigationRef}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef.current.getCurrentRoute().name;

          if (previousRouteName !== currentRouteName) {
            await onScreenChangeAsync(currentRouteName === 'Main' ? null : currentRouteName);
          }

          routeNameRef.current = currentRouteName;
        }}>
        <DevMenuContainer {...props} navigation={navigationRef.current} />
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
