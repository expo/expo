import React from 'react';
import { Appearance, StyleSheet, Text, View } from 'react-native';
import type { NativeEventSubscription } from 'react-native';

type ColorSchemeName = Appearance.AppearancePreferences['colorScheme'];

interface State {
  colorScheme: ColorSchemeName;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class AppearanceScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Appearance',
  };

  subscription?: NativeEventSubscription;

  state: State = {
    colorScheme: Appearance.getColorScheme(),
  };

  componentDidMount() {
    this.subscription = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
        this.setState({ colorScheme });
      }
    );
  }

  componentWillUnmount() {
    if (this.subscription) this.subscription.remove();
  }

  render() {
    const { colorScheme } = this.state;
    const isDark = colorScheme === 'dark';

    return (
      <View style={[styles.screen, isDark ? styles.darkScreen : styles.lightScreen]}>
        <Text style={isDark ? styles.darkText : styles.lightText}>
          {`Current color scheme: `}

          <Text style={styles.boldText}>{this.state.colorScheme}</Text>
        </Text>
      </View>
    );
  }
}

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
