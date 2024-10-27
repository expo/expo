import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function AppearanceScreen() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.screen, isDark ? styles.darkScreen : styles.lightScreen]}>
      <Text style={isDark ? styles.darkText : styles.lightText}>
        {`Current color scheme: `}

        <Text style={styles.boldText}>{colorScheme}</Text>
      </Text>
    </View>
  );
}

AppearanceScreen.navigationOptions = {
  title: 'Appearance',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightScreen: {
    backgroundColor: '#f8f8f9',
  },
  darkScreen: {
    backgroundColor: '#000',
  },
  lightText: {
    color: '#242c39',
  },
  darkText: {
    color: '#fff',
  },
  boldText: {
    fontWeight: 'bold',
  },
});
