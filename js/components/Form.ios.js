/* @flow */

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo';

export class FormInput extends React.Component {
  state = {
    labelWidth: null,
  };

  _input: TextInput;

  shouldComponentUpdate(nextProps: any) {
    if (nextProps.value === this.props.value && nextProps.labelWidth === this.props.labelWidth) {
      return false;
    }

    return true;
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      requestAnimationFrame(() => {
        this._input && this._input.focus();
      });
    }
  }

  focus() {
    this._input && this._input.focus();
  }

  blur() {
    this._input && this._input.blur();
  }

  _handleLayoutLabel = (e: any) => {
    let width = e.nativeEvent.layout.width;
    this.setState({ labelWidth: width });
  };

  _renderGradientOverlay = () => {
    return (
      <LinearGradient
        colors={['rgba(255,255,255, 1)', 'rgba(255,255,255, 0.2)']}
        start={[0.5, 0]}
        end={[1, 0]}
        style={{
          position: 'absolute',
          left: this.state.labelWidth,
          right: 0,
          top: 0,
          bottom: 0,
          width: 30,
        }}
      />
    );
  };

  render() {
    let { label, hideBottomBorder, style, ...props } = this.props;

    return (
      <View
        style={[
          styles.inputContainer,
          hideBottomBorder && styles.inputContainerWithoutBorderBottom,
        ]}>
        <View style={styles.inputLabelContainer} onLayout={this._handleLayoutLabel}>
          <Text style={styles.inputLabelText}>{label}</Text>
        </View>

        <TextInput
          ref={view => {
            this._input = view;
          }}
          {...props}
          style={[styles.textInput, style]}
        />

        {this.state.labelWidth && this._renderGradientOverlay()}
      </View>
    );
  }
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
  formContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(46, 59, 76, 0.10)',
  },
  inputContainer: {
    height: 50,
    marginHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: 'rgba(46, 59, 76, 0.10)',
  },
  inputContainerWithoutBorderBottom: {
    borderBottomWidth: 0,
  },
  textInput: {
    flex: 1,
    textAlign: 'right',
    paddingHorizontal: 10,
    paddingTop: 1,
  },
  inputLabelContainer: {
    justifyContent: 'center',
    paddingLeft: 5,
  },
  inputLabelText: {
    fontSize: 15,
  },
});
