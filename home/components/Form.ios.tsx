import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { StyledText } from './Text';
import { StyledView } from './Views';

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  autoFocus?: boolean;
  label?: string;
  hideBottomBorder?: boolean;
};

export const FormInput = React.forwardRef((props: FormInputProps, ref) => {
  const [labelWidth, setLabelWidth] = React.useState<number>(0);
  const theme = useTheme();
  const _input = React.useRef<TextInput>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      focus() {
        if (_input.current) _input.current.focus();
      },
      blur() {
        if (_input.current) _input.current.blur();
      },
    }),
    [_input]
  );
  // shouldComponentUpdate(nextProps: any) {
  //   if (nextProps.value === this.props.value && nextProps.labelWidth === this.props.labelWidth) {
  //     return false;
  //   }

  //   return true;
  // }

  React.useEffect(() => {
    if (props.autoFocus) {
      requestAnimationFrame(() => {
        _input.current?.focus();
      });
    }
  }, []);

  const _handleLayoutLabel = (e: any) => {
    const width = e.nativeEvent.layout.width;
    setLabelWidth(width);
  };

  const _renderGradientOverlay = () => {
    if (theme.dark) {
      return;
    }

    return (
      <LinearGradient
        colors={['rgba(255,255,255, 1)', 'rgba(255,255,255, 0.2)']}
        start={[0.5, 0]}
        end={[1, 0]}
        style={{
          position: 'absolute',
          left: labelWidth,
          right: 0,
          top: 0,
          bottom: 0,
          width: 30,
        }}
      />
    );
  };

  const { label, hideBottomBorder, style, ...restProps } = props;

  return (
    <StyledView
      style={[styles.inputContainer, hideBottomBorder && styles.inputContainerWithoutBorderBottom]}>
      <StyledView style={styles.inputLabelContainer} onLayout={_handleLayoutLabel}>
        <StyledText style={styles.inputLabelText}>{label}</StyledText>
      </StyledView>
      <TextInput
        ref={_input}
        {...restProps}
        style={[styles.textInput, { color: theme.dark ? '#fff' : '#000' }, style]}
      />
      {!!labelWidth && _renderGradientOverlay()}
    </StyledView>
  );
});

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
