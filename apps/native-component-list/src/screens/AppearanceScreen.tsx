import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { BodyText } from '../components/BodyText';

export default function AppearanceScreen() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.screen, isDark ? styles.darkScreen : styles.lightScreen]}>
      <BodyText>
        {`Current color scheme: `}

        <Text style={styles.boldText}>{colorScheme}</Text>
      </BodyText>
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
  boldText: {
    fontWeight: 'bold',
  },
});
