import React from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';

const TOAST_FADE_DURATION = 1000;
const TOAST_VISIBLE_DURATION = 2000;

export default class Toast extends React.Component {
  state = {
    opacity: new Animated.Value(0.0),
  };

  componentWillUnmount() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  show = () => {
    Animated.timing(this.state.opacity, {
      toValue: 1.0,
      duration: TOAST_FADE_DURATION,
    }).start(() => this.hideToast());
  };

  hideToast = () => {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      Animated.timing(this.state.opacity, {
        toValue: 0.0,
        duration: TOAST_FADE_DURATION,
      }).start(() => this.setState({ showToast: false }));
    }, TOAST_VISIBLE_DURATION);
  };

  render() {
    return (
      <View style={styles.wrapper}>
        <Animated.View style={[styles.toast, { opacity: this.state.opacity }]}>
          <Text style={styles.text}>No points detected</Text>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    elevation: 999,
    alignItems: 'center',
    zIndex: 10000,
    marginTop: 20,
  },
  toast: {
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 20,
  },
  text: {
    color: 'black',
    padding: 10,
  },
});
