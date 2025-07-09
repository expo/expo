import React, { Component } from 'react';
import { StyleSheet, Button, View, TextInput } from 'react-native';
import { Screen, ScreenStack } from 'react-native-screens';

type StackProps = {
  renderScreen: (key: string) => React.ReactElement;
};

type StackState = {
  stack: string[];
  transitioning: number;
};

const COLORS = ['azure', 'pink', 'cyan'];

export class Stack extends Component<StackProps, StackState> {
  state = {
    stack: ['azure'],
    transitioning: 0,
  };

  push(key: string) {
    const { stack } = this.state;
    this.setState({ stack: [...stack, key], transitioning: 1 });
  }

  pop() {
    const { stack } = this.state;
    this.setState({ transitioning: 0, stack: stack.slice(0, -1) });
  }

  remove(index: number) {
    const { stack } = this.state;
    this.setState({ stack: stack.filter((v, idx) => idx !== index) });
  }

  removeByKey(key: string) {
    const { stack } = this.state;
    this.setState({ stack: stack.filter((v) => key !== v) });
  }

  renderScreen = (key: string) => {
    return (
      <Screen
        style={StyleSheet.absoluteFill}
        key={key}
        stackAnimation="fade"
        stackPresentation="push"
        onDismissed={() => this.removeByKey(key)}>
        {this.props.renderScreen(key)}
      </Screen>
    );
  };

  render() {
    const screens = this.state.stack.map(this.renderScreen);
    return <ScreenStack style={styles.container}>{screens}</ScreenStack>;
  }
}

class App extends Component {
  stackRef = React.createRef<Stack>();

  renderScreen = (key: string) => {
    const index = COLORS.indexOf(key);
    const color = key;
    const pop = index > 0 ? () => this.stackRef.current?.pop() : null;
    const push = index < 2 ? () => this.stackRef.current?.push(COLORS[index + 1]) : null;
    const remove = index > 1 ? () => this.stackRef.current?.remove(1) : null;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          // margin: index * 40,
        }}>
        <View
          style={{
            position: 'absolute',
            top: 110,
            left: 0,
            width: 80,
            height: 80,
            backgroundColor: 'black',
          }}
        />
        {pop && <Button title="Pop" onPress={pop} />}
        {push && <Button title="Push" onPress={push} />}
        {remove && <Button title="Remove middle screen" onPress={remove} />}
        <TextInput placeholder="Hello" style={styles.textInput} />
        <View style={{ height: 100, backgroundColor: 'red', width: '70%' }} />
      </View>
    );
  };

  render() {
    return <Stack ref={this.stackRef} renderScreen={this.renderScreen} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
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
