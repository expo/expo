import React, { Component } from 'react';
import { StyleSheet, Button, View, TextInput, Animated, Easing } from 'react-native';
import { Screen, ScreenStack } from 'expo/DangerZone';

const COLORS = ['azure', 'pink', 'cyan'];

export class Stack extends Component {
  constructor(props) {
    super(props);

    const progress = new Animated.Value(0);
    const slideIn = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [320, 0],
    });
    const slideOut = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 320],
    });
    const backSlideIn = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });
    const backSlideOut = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -50],
    });

    this.state = {
      stack: ['azure'],
      transitioning: 0,
      progress,
      slideIn,
      slideOut,
      backSlideIn,
      backSlideOut,
    };
  }
  push(key) {
    this.setState({ stack: [...this.state.stack, key], transitioning: 1 });
    this.state.progress.setValue(0);
    Animated.timing(this.state.progress, {
      duration: 500,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ transitioning: 0 });
    });
  }
  pop() {
    this.setState({ transitioning: -1 });
    this.state.progress.setValue(0);
    Animated.timing(this.state.progress, {
      duration: 500,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start(() => {
      this.setState({
        transitioning: 0,
        stack: this.state.stack.slice(0, -1),
      });
    });
  }
  renderScreen = (key, index) => {
    let style = StyleSheet.absoluteFill;
    const { stack, transitioning } = this.state;
    if (index === stack.length - 1) {
      if (transitioning > 0) {
        style = {
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: this.state.slideIn }],
        };
      } else if (transitioning < 0) {
        style = {
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: this.state.slideOut }],
        };
      }
    } else if (index === stack.length - 2) {
      if (transitioning > 0) {
        style = {
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: this.state.backSlideOut }],
        };
      } else if (transitioning < 0) {
        style = {
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX: this.state.backSlideIn }],
        };
      }
    }
    const active =
      index === stack.length - 1 || (transitioning !== 0 && index === stack.length - 2);
    return (
      <Screen style={style} key={key} active={active ? 1 : 0}>
        {this.props.renderScreen(key)}
      </Screen>
    );
  };
  render() {
    const screens = this.state.stack.map(this.renderScreen);
    return (
      <ScreenStack
        transitioning={this.state.transitioning}
        progress={this.state.progress}
        style={styles.container}>
        {screens}
      </ScreenStack>
    );
    // return (
    //   <ScreenContainer style={styles.container}>{screens}</ScreenContainer>
    // );
  }
}

class App extends Component {
  renderScreen = key => {
    const index = COLORS.indexOf(key);
    const color = key;
    const pop = index > 0 ? () => this.stack.pop() : null;
    const push = index < 2 ? () => this.stack.push(COLORS[index + 1]) : null;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {pop && <Button title="Pop" onPress={pop} />}
        {push && <Button title="Push" onPress={push} />}
        <TextInput placeholder="Hello" style={styles.textInput} />
      </View>
    );
  };
  render() {
    return <Stack ref={stack => (this.stack = stack)} renderScreen={this.renderScreen} />;
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
