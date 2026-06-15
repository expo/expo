import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, createWebComponent, css, durations, easings, shadows } from '../webUtils';
import type { SliderProps } from './types';

const Input = createWebComponent('input');

const styles = StyleSheet.create({
  view: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  input: {
    appearance: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    height: 22,
    margin: 0,
    padding: 0,
    '--_track-bg': colors.gray[200],
    '--_track-fill': colors.primary[500],
  } as ViewStyle,
  disabled: {
    cursor: 'auto',
    opacity: 0.5,
  },
});

const sliderCss = css`
  [data-expo-ui-slider]::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--_track-fill) 0 var(--_pct),
      var(--_track-bg) var(--_pct) 100%
    );
  }

  [data-expo-ui-slider]::-moz-range-track {
    height: 4px;
    border-radius: 999px;
    background: var(--_track-bg);
  }

  [data-expo-ui-slider]::-moz-range-progress {
    height: 4px;
    border-radius: 999px;
    background: var(--_track-fill);
  }

  [data-expo-ui-slider]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 1.5px solid ${colors.primary[500]};
    margin-top: -7px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition-property: transform, box-shadow;
    transition-duration: ${durations.fast};
    transition-timing-function: ${easings.standard};
  }

  [data-expo-ui-slider]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 1.5px solid ${colors.primary[500]};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  [data-expo-ui-slider]:hover:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.1);
  }

  [data-expo-ui-slider]:focus-visible {
    outline: none;
  }

  [data-expo-ui-slider]:focus-visible::-webkit-slider-thumb {
    box-shadow: ${shadows.focus};
  }

  [data-expo-ui-slider]:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.15);
    box-shadow: 0 0 0 6px color-mix(in oklab, ${colors.primary[500]} 18%, transparent);
  }
`;

/**
 * A control for selecting a value from a continuous or stepped range.
 */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled = false,
  testID,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.view}>
      <style href="expo-ui-slider" precedence="expo-ui">
        {sliderCss}
      </style>

      <Input
        type="range"
        dataSet={{ expoUiSlider: '' }}
        value={value}
        min={min}
        max={max}
        step={step ?? 'any'}
        disabled={disabled}
        onChange={({ target: { value } }) => onValueChange(Number.parseFloat(value))}
        data-testid={testID}
        style={[styles.input, { '--_pct': `${pct}%` } as ViewStyle, disabled && styles.disabled]}
      />
    </View>
  );
}

export * from './types';
