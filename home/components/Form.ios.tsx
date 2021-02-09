import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TextInput, InteractionManager, LayoutChangeEvent } from 'react-native';

import { StyledText } from './Text';
import { StyledView } from './Views';

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  autoFocus?: boolean;
  label?: string;
  hideBottomBorder?: boolean;
};

export const FormInput = React.forwardRef(
  ({ label, autoFocus, hideBottomBorder, ...props }: FormInputProps, ref) => {
    const theme = useTheme();
    const input = React.useRef<TextInput>(null);
    const [labelWidth, setLabelWidth] = React.useState<number>(0);

    React.useImperativeHandle(
      ref,
      () => ({
        focus() {
          input.current?.focus?.();
        },
        blur() {
          input.current?.blur?.();
        },
      }),
      [input]
    );

    // We need to auto focus manually to ensure autofill works as expected. Otherwise a single property will be auto filled at a time.
    React.useEffect(() => {
      if (autoFocus) {
        InteractionManager.runAfterInteractions(() => {
          input.current?.focus?.();
        });
      }
    }, []);

    const onLayoutLabel = (e: LayoutChangeEvent) => {
      setLabelWidth(e.nativeEvent.layout.width);
    };

    return (
      <StyledView
        style={[
          styles.inputContainer,
          hideBottomBorder && styles.inputContainerWithoutBorderBottom,
        ]}>
        <StyledView style={styles.inputLabelContainer} onLayout={onLayoutLabel}>
          <StyledText style={styles.inputLabelText}>{label}</StyledText>
        </StyledView>
        <TextInput
          ref={input}
          {...props}
          style={[styles.textInput, { color: theme.dark ? '#fff' : '#000' }, props.style]}
        />
        {!!labelWidth && !theme.dark && <GradientOverlay left={labelWidth} />}
      </StyledView>
    );
  }
);

function GradientOverlay({ left }: { left: number }) {
  return (
    <LinearGradient
      colors={['rgba(255,255,255, 1)', 'rgba(255,255,255, 0.2)']}
      start={[0.5, 0]}
      end={[1, 0]}
      style={{
        position: 'absolute',
        left,
        right: 0,
        top: 0,
        bottom: 0,
        width: 30,
      }}
    />
  );
}

export default class Form extends React.Component<any> {
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
