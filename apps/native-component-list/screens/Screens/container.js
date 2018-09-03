import React, { Component } from 'react';
import { StyleSheet, Button, View, TextInput } from 'react-native';
import { Screen, ScreenContainer } from 'expo/DangerZone';

export class LazyTabs extends Component {
  state = {
    screens: ['azure'],
    active: 'azure',
  };
  goto(key) {
    let { screens } = this.state;
    if (screens.indexOf(key) === -1) {
      screens = [...screens, key];
    }
    this.setState({ active: key, screens });
  }
  renderScreen = (key, index) => {
    const active = key === this.state.active ? 1 : 0;
    return (
      <Screen style={StyleSheet.absoluteFill} key={key} active={active}>
        {this.props.renderScreen(key)}
      </Screen>
    );
  };
  render() {
    const screens = this.state.screens.map(this.renderScreen);
    return <ScreenContainer style={styles.container}>{screens}</ScreenContainer>;
  }
}

class App extends Component {
  renderScreen = key => {
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
        <LazyTabs ref={tabs => (this.tabs = tabs)} renderScreen={this.renderScreen} />
        <View style={styles.tabbar}>
          <Button style={styles.tabbutton} title="azure" onPress={() => this.tabs.goto('azure')} />
          <Button style={styles.tabbutton} title="pink" onPress={() => this.tabs.goto('pink')} />
          <Button style={styles.tabbutton} title="cyan" onPress={() => this.tabs.goto('cyan')} />
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
