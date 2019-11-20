import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Appearance, ColorSchemeName, AppearanceListener } from 'react-native-appearance';

interface State {
  colorScheme: ColorSchemeName;
}

export default class AppearanceScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Appearance',
  };

  subscription: AppearanceListener;

  state: State = {
    colorScheme: Appearance.getColorScheme(),
  };

  componentDidMount() {
    this.subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      this.setState({ colorScheme });
    });
  }

  componentWillUnmount() {
    this.subscription.remove();
    this.subscription = null;
  }

  render() {
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
