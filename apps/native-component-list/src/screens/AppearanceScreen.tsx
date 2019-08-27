import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Appearance } from 'react-native-appearance';
import { ColorSchemeName } from 'react-native-appearance/src/Appearance.types';

interface State {
  colorScheme: ColorSchemeName;
}

export default class AppearanceScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Appearance',
  };

  subscription: any;

  state: State = {
    colorScheme: Appearance.getColorScheme(),
  };

  componentDidMount() {
    this.subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: any }) => {
      console.log('color scheme:', colorScheme);
      this.setState({ colorScheme });
    });
  }

  componentWillUnmount() {
    this.subscription.remove();
    this.subscription = null;
  }

  render() {
    console.log('rendering color scheme:', this.state.colorScheme);
    const { colorScheme } = this.state;
    const isDark = colorScheme === 'dark';

    return (
      <View style={[styles.screen, isDark ? styles.darkScreen : styles.lightScreen]}>
        <Text style={isDark ? styles.darkText : styles.lightText}>
          {`Current color scheme: `}
          
          <Text style={styles.boldText}>
            {this.state.colorScheme}
          </Text>
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
