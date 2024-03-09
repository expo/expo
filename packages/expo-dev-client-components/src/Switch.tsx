import * as React from 'react';
import {
  Platform,
  StyleProp,
  SwitchProps,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const nativeSwitchAvailable = Platform.OS === 'android' || !Platform.isTV;

const NativeSwitch = nativeSwitchAvailable ? require('react-native').Switch : undefined;

export interface TvSwitchProps {
  disabled?: boolean;
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * The value of the field. If true the component will be turned on.
   */
  value?: boolean;
  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: SwitchProps['onValueChange'];
  /**
   * Style overrides for the container
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * The label text to display if not using `labelTx`.
   */
  label?: string;
}

const palette = {
  neutral100: '#FFFFFF',
  neutral200: '#F4F2F1',
  neutral300: '#D7CEC9',
  neutral400: '#B6ACA6',
  neutral500: '#978F8A',
  neutral600: '#564E4A',
  neutral700: '#3C3836',
  neutral800: '#191015',
  neutral900: '#000000',

  primary100: '#F4E0D9',
  primary200: '#E8C1B4',
  primary300: '#DDA28E',
  primary400: '#D28468',
  primary500: '#C76542',
  primary600: '#A54F31',

  secondary100: '#DCDDE9',
  secondary200: '#BCC0D6',
  secondary300: '#9196B9',
  secondary400: '#626894',
  secondary500: '#41476E',

  accent100: '#FFEED4',
  accent200: '#FFE1B2',
  accent300: '#FDD495',
  accent400: '#FBC878',
  accent500: '#FFBB50',

  angry100: '#F2D6CD',
  angry500: '#C03403',

  overlay20: 'rgba(25, 16, 21, 0.2)',
  overlay50: 'rgba(25, 16, 21, 0.5)',
};

const colors = {
  palette,
  transparent: 'transparent',
  border: 'black',
};

/**
 * Describe your component here
 */
const TvSwitch = (props: TvSwitchProps) => {
  const { value, disabled, onValueChange, label } = props;

  const knobWidth = 30;
  const knobHeight = 30;

  const offBackgroundColor = disabled ? colors.palette.neutral400 : colors.palette.neutral300;

  const onBackgroundColor = colors.palette.secondary500;

  const knobBackgroundColor = (function () {
    if (value) {
      return [disabled && colors.palette.neutral600, colors.palette.neutral100].filter(Boolean)[0];
    } else {
      return [colors.palette.neutral200].filter(Boolean)[0];
    }
  })();

  const $switchKnob = (value, knobWidth) => ({
    marginStart: value
      ? knobWidth - ($switchInner.paddingEnd ?? 0)
      : $switchInner.paddingStart ?? 0,
  });

  const handlePress = () => {
    if (disabled) {
      return;
    }
    onValueChange?.(!value);
  };

  return (
    <View style={$container}>
      <TouchableOpacity onPress={handlePress} hasTVPreferredFocus>
        <View style={[$inputOuterVariants.switch, { backgroundColor: offBackgroundColor }]}>
          <View
            style={[
              $switchInner,
              { backgroundColor: onBackgroundColor },
              { opacity: value ? 1 : 0 },
            ]}
          />

          <View
            style={[
              $switchDetail,
              $switchKnob(value, knobWidth),
              { width: knobWidth, height: knobHeight },
              { backgroundColor: knobBackgroundColor },
            ]}
          />
        </View>
      </TouchableOpacity>
      {label ? <Text style={$text}>{label}</Text> : null}
    </View>
  );
};

const $container: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  width: '100%',
};

const $text: TextStyle = {
  fontSize: 30,
  color: colors.palette.primary500,
  marginStart: 8,
  flex: 1,
};

const $switchInner: ViewStyle & { paddingStart: number; paddingEnd: number } = {
  width: '100%',
  height: '100%',
  alignItems: 'center',
  borderColor: colors.border,
  overflow: 'hidden',
  position: 'absolute',
  paddingStart: 4,
  paddingEnd: 4,
};

const $switchDetail: any = {
  borderRadius: 12,
  position: 'absolute',
  width: 24,
  height: 24,
};

const $inputOuterBase: ViewStyle = {
  height: 24,
  width: 24,
  borderWidth: 2,
  alignItems: 'center',
  overflow: 'hidden',
  flexGrow: 0,
  flexShrink: 0,
  justifyContent: 'space-between',
  flexDirection: 'row',
};

const $inputOuterVariants: any = {
  checkbox: [$inputOuterBase, { borderRadius: 4 }],
  radio: [$inputOuterBase, { borderRadius: 12 }],
  switch: [
    $inputOuterBase,
    {
      height: 32,
      width: 56,
      borderRadius: 16,
      borderWidth: 0,
    },
  ],
};

export const Switch = nativeSwitchAvailable ? NativeSwitch : TvSwitch;
