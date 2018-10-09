// @flow

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import AR from '../AR';

const IconButton = ({ style, onPress, icon }) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <View style={styles.button}>
      <Ionicons name={icon} size={32} color="white" />
    </View>
  </TouchableOpacity>
);

class ARRunningState extends React.Component {
  state = { running: true };

  componentDidMount() {
    this.onSessionWasInterrupted = AR.onSessionWasInterrupted(this.pause());
  }

  componentWillUnmount() {
    this.onSessionWasInterrupted.remove();
  }

  render() {
    return (
      <View
        style={[
          styles.container,
          this.props.style,
        ]}
      >
        <IconButton icon={this.iconName} onPress={this.onPress} />
      </View>
    );
  }

  onPress = () => {
    this.toggleRunning();
    if (this.props.onPress) {
      this.props.onPress();
    }
  };

  pause = () => {
    if (!this.state.running) { return; }
    this.toggleRunning();
  };

  toggleRunning = () => {
    const { running } = this.state;
    this.setState({ running: !running }, () => {
      if (!running) { // state already changed to !running
        AR.resume();
      } else {
        AR.pause();
      }
    });
  };

  get iconName() {
    return this.state.running ? 'md-play' : 'md-pause';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
    padding: 24,
  },
  button: {
    aspectRatio: 1,
    width: 56,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ARRunningState;
