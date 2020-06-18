/* @flow */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemeContext } from 'react-navigation';

import { StyledText } from './Text';
import { StyledView } from './Views';

export class FormInput extends React.Component {
  static contextType = ThemeContext;

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
    const width = e.nativeEvent.layout.width;
    this.setState({ labelWidth: width });
  };

  _renderGradientOverlay = () => {
    if (this.context === 'dark') {
      return;
    }

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
    const { label, hideBottomBorder, style, ...props } = this.props;

    return (
      <StyledView
        style={[
          styles.inputContainer,
          hideBottomBorder && styles.inputContainerWithoutBorderBottom,
        ]}>
        <StyledView style={styles.inputLabelContainer} onLayout={this._handleLayoutLabel}>
          <StyledText style={styles.inputLabelText}>{label}</StyledText>
        </StyledView>

        <TextInput
          ref={view => {
            this._input = view;
          }}
          {...props}
          style={[styles.textInput, { color: this.context === 'dark' ? '#fff' : '#000' }, style]}
        />

        {this.state.labelWidth && this._renderGradientOverlay()}
      </StyledView>
    );
  }
}

export default class Form extends React.Component {
  static Input = FormInput;

  render() {
    return (
      <StyledView {...this.props} style={[styles.formContainer, this.props.style]}>
        {this.props.children}
      </StyledView>
    );
  }
}

const styles = StyleSheet.create({
  formContainer: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  inputContainer: {
    height: 50,
    marginHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
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
