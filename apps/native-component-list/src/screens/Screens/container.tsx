// @ts-nocheck
import React from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { Screen, ScreenContainer } from 'react-native-screens';

export class LazyTabs extends React.Component<{ renderScreen: (key: string) => JSX.Element }> {
  state = {
    screens: ['azure'],
    active: 'azure',
  };

  goto = (key: string) => {
    let { screens } = this.state;
    if (screens.indexOf(key) === -1) {
      screens = [...screens, key];
    }
    this.setState({ active: key, screens });
  };

  renderScreen = (key: string) => {
    const active = key === this.state.active ? 1 : 0;
    return (
      <Screen style={StyleSheet.absoluteFill} key={key} activityState={active}>
        {this.props.renderScreen(key)}
      </Screen>
    );
  };

  render() {
    return (
      <ScreenContainer style={styles.container}>
        {this.state.screens.map(this.renderScreen)}
      </ScreenContainer>
    );
  }
}

class App extends React.Component {
  tabs?: LazyTabs;

  renderScreen = (key: string) => {
    const color = key;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TextInput placeholder="Hello" style={styles.textInput} />
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <LazyTabs ref={(tabs) => (this.tabs = tabs!)} renderScreen={this.renderScreen} />
        <View style={styles.tabbar}>
          <Button title="azure" onPress={() => this.tabs!.goto('azure')} />
          <Button title="pink" onPress={() => this.tabs!.goto('pink')} />
          <Button title="cyan" onPress={() => this.tabs!.goto('cyan')} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  tabbar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 20,
    alignSelf: 'stretch',
    borderColor: 'black',
  },
});

export default App;
