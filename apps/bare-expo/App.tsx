import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const onSwitchTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  const rnColors = {
    light: {
      atomColor: 'crimson',
      orbitsColor: 'cadetblue',
    },
    dark: {
      atomColor: 'goldenrod',
      orbitsColor: 'limegreen',
    },
  };

  return (
    <View style={styles.container}>
      {/* <Image
        placeholder={require('../native-component-list/assets/images/expo.svg')}
        placeholderContentFit="contain"
        style={styles.image}
        tintColor="red"
      /> */}
      <Image
        source={require('../native-component-list/assets/images/expo.svg')}
        contentFit="scale-down"
        style={styles.image}
      />
      <Image
        source={require('../native-component-list/assets/images/rn.svg')}
        contentFit="scale-down"
        style={styles.image}
        transition={500}
        svgColorMap={rnColors[theme]}
      />
      {/* <Image
        source={require('../native-component-list/assets/images/user.png')}
        style={styles.image}
        tintColor="yellow"
      /> */}
      {/* <Image
        source="https://d33wubrfki0l68.cloudfront.net/554c3b0e09cf167f0281fda839a5433f2040b349/ecfc9/img/header_logo.svg"
        style={styles.image}
        tintColor="cyan"
      /> */}
      <Button title="Switch theme" onPress={onSwitchTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 8,
  },
  image: {
    width: 100,
    height: 100,
    // backgroundColor: 'brown',
  },
});
