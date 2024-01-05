import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

import Colors from '../constants/Colors';

type FormInputProps = React.ComponentProps<typeof TextInput> & {
  autoFocus?: boolean;
  label?: string;
  // unused on Android
  hideBottomBorder?: boolean;
};

const FormInput = React.forwardRef((props: FormInputProps, ref) => {
  const theme = useTheme();
  const inputRef = React.useRef<TextInput>(null);

  const [isFocused, setFocused] = React.useState(false);
  const labelPosition = React.useMemo(() => new Animated.Value(props.value ? 1 : 0), []);
  const lastValue = React.useRef<string | undefined>(undefined);

  React.useImperativeHandle(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus?.();
      },
      blur() {
        inputRef.current?.blur?.();
      },
    }),
    [inputRef]
  );

  React.useEffect(() => {
    _updateLabel(props.value, lastValue.current);
    lastValue.current = props.value;
  }, [props.value]);

  const _updateLabel = (nextValue: string = '', previousValue: string = '') => {
    if (nextValue.length === previousValue.length) {
      return;
    } else if (nextValue.length > 0 && previousValue.length > 0) {
      return;
    }

    if (nextValue.length > 0) {
      Animated.timing(labelPosition, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      labelPosition.setValue(0);
    }
  };

  const animatedLabelStyle = React.useMemo(() => {
    const opacity = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const translateY = labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });

    return {
      opacity,
      transform: [{ translateY }],
    };
  }, [labelPosition]);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        ref={inputRef}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        underlineColorAndroid={
          isFocused ? Colors.light.tintColor : !theme.dark ? 'rgba(46, 59, 76, 0.10)' : '#888'
        }
        {...props}
        placeholder={props.label}
        placeholderTextColor={!theme.dark ? 'rgba(36, 44, 58, 0.4)' : '#ccc'}
        style={[styles.textInput, theme.dark && { color: '#fff' }, props.style]}
      />
      <Animated.View style={[styles.floatingLabel, animatedLabelStyle]}>
        <Text
          style={[
            styles.floatingLabelText,
            {
              color: !theme.dark ? 'rgba(0, 0, 0, 0.38)' : '#fff',
            },
          ]}>
          {props.label}
        </Text>
      </Animated.View>
    </View>
  );
});

export default function Form(props: React.ComponentProps<typeof View> & { children?: any }) {
  return <View {...props} style={[styles.formContainer, props.style]} />;
}

Form.Input = FormInput;

const styles = StyleSheet.create({
  formContainer: {},
  inputContainer: {
    height: 60,
    marginHorizontal: 10,
    flexDirection: 'row',
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
  },
});
