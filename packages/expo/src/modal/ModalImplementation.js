// @flow

import React, { Component } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';

export type ModalProps = {
  visible: boolean,
  onRequestClose: Function,
  onShow?: Function,
  animationType?: 'none' | 'slide' | 'fade',
  transparent?: boolean,
  children?: any,
};

type Props = ModalProps & {
  layout: { height: number, width: number },
};

type State = {
  visible: Animated.Value,
  rendered: boolean,
};

export default class ModalImplementation extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      visible: new Animated.Value(props.visible ? 1 : 0),
      rendered: props.visible,
    };
  }

  state: State;

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this._handleHardwareBack);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.visible !== nextProps.visible) {
      if (nextProps.animationType === 'none') {
        this.setState({ rendered: nextProps.visible });
      } else {
        if (nextProps.visible) {
          this.setState(
            {
              rendered: true,
            },
            () =>
              Animated.timing(this.state.visible, {
                toValue: 1,
                duration: 300,
                easing: Easing.quad,
                useNativeDriver: true,
              }).start(nextProps.onShow)
          );
        } else {
          Animated.timing(this.state.visible, {
            toValue: 0,
            duration: 250,
            easing: Easing.quad,
            useNativeDriver: true,
          }).start(finished => {
            if (finished) {
              this.setState({
                rendered: false,
              });
            }
          });
        }
      }
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this._handleHardwareBack);
  }

  _handleHardwareBack = () => {
    if (this.props.onRequestClose && this.props.visible) {
      this.props.onRequestClose();
      return true;
    }
    return false;
  };

  render() {
    const { animationType, transparent, layout } = this.props;
    const { visible, rendered } = this.state;

    if (!rendered) {
      return null;
    }

    const opacity = animationType === 'fade' ? visible : 1;
    const translate =
      animationType === 'slide'
        ? visible.interpolate({
            inputRange: [0, 1],
            outputRange: [layout.height, 0],
          })
        : 0;

    return (
      <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
        {transparent ? null : (
          <Animated.View style={[styles.backdrop, styles.container, { opacity: visible }]} />
        )}
        <Animated.View
          style={[
            styles.content,
            transparent ? null : styles.background,
            { opacity, transform: [{ translateY: translate }] },
          ]}>
          {this.props.children}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
  background: {
    backgroundColor: 'white',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, .6)',
  },
});
