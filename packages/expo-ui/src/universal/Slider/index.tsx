import { View, type ViewStyle } from 'react-native';

import type { SliderProps } from './types';

/**
 * A control for selecting a value from a continuous or stepped range.
 */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled,
  testID,
}: SliderProps) {
  return (
    <View style={containerStyle}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step ?? 'any'}
        disabled={disabled}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
        data-testid={testID}
        style={inputStyle}
      />
    </View>
  );
}

const containerStyle: ViewStyle = {
  alignSelf: 'stretch',
  justifyContent: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  cursor: 'pointer',
};

export * from './types';
