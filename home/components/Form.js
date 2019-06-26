/* @flow */

import React from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

import Colors from '../constants/Colors';

export class FormInput extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      isFocused: false,
      labelPosition: new Animated.Value(this.props.value ? 1 : 0),
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.value === this.props.value && nextState.isFocused === this.state.isFocused) {
      return false;
    }

    return true;
  }

  componentDidMount() {
    this._updateLabel(this.props.value);

    if (this.props.autoFocus) {
      requestAnimationFrame(() => {
        this._input && this._input.focus();
      });
    }
  }

  render() {
    let { style, ...props } = this.props;

    return (
      <View style={styles.inputContainer}>
        <TextInput
          ref={view => {
            this._input = view;
          }}
          onFocus={this._handleFocus}
          onBlur={this._handleBlur}
          underlineColorAndroid={this.state.isFocused ? Colors.tintColor : 'rgba(46, 59, 76, 0.10)'}
          {...props}
          placeholder={this.props.label}
          placeholderTextColor="rgba(36, 44, 58, 0.4)"
          style={[styles.textInput, style]}
        />
        <Animated.View style={[styles.floatingLabel, this._getAnimatedLabelStyles()]}>
          <Text style={styles.floatingLabelText}>{this.props.label}</Text>
        </Animated.View>
      </View>
    );
  }

  focus() {
    this._input && this._input.focus();
  }

  blur() {
    this._input && this._input.blur();
  }

  _handleFocus = () => {
    this.setState({ isFocused: true });
  };

  _handleBlur = () => {
    this.setState({ isFocused: false });
  };

  componentWillReceiveProps(nextProps) {
    this._updateLabel(nextProps.value, this.props.value);
  }

  _updateLabel(nextValue, previousValue) {
    nextValue = nextValue || '';
    previousValue = previousValue || '';

    if (nextValue.length === previousValue.length) {
      return;
    } else if (nextValue.length > 0 && previousValue.length > 0) {
      return;
    }

    if (nextValue.length > 0) {
      Animated.timing(this.state.labelPosition, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      this.state.labelPosition.setValue(0);
    }
  }

  _getAnimatedLabelStyles = () => {
    let { labelPosition } = this.state;

    let opacity = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    let translateY = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    return {
      opacity,
      transform: [{ translateY }],
    };
  };
}

export default class Form extends React.Component {
  static Input = FormInput;

  render() {
    return (
      <View {...this.props} style={[styles.formContainer, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  formContainer: {},
  inputContainer: {
    height: 60,
    marginHorizontal: 10,
    flexDirection: 'row',
  },
  inputContainerWithoutBorderBottom: {
    borderBottomWidth: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  inputLabelContainer: {
    justifyContent: 'center',
  },
  floatingLabel: {
    position: 'absolute',
    top: 0,
    left: 10,
  },
  floatingLabelText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.38)',
  },
});
