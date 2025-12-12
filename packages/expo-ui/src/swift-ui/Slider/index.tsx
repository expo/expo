import { requireNativeView } from 'expo';
import type { NativeSyntheticEvent } from 'react-native';

import { type CommonViewModifierProps } from '../types';

export type SliderProps = {
  /**
   * The current value of the slider.
   */
  value?: number;
  /**
   * The step increment for the slider. Use `0` for continuous (no steps).
   */
  step?: number;
  /**
   * The minimum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
   */
  min?: number;
  /**
   * The maximum value of the slider. Updating this value does not trigger callbacks if the current value is above `max`.
   */
  max?: number;
  /**
   * A label describing the slider's purpose.
   */
  label?: React.ReactNode;
  /**
   * A label displayed at the minimum value position.
   */
  minimumValueLabel?: React.ReactNode;
  /**
   * A label displayed at the maximum value position.
   */
  maximumValueLabel?: React.ReactNode;
  /**
   * Callback triggered on dragging along the slider.
   */
  onValueChange?: (value: number) => void;
  /**
   * Callback triggered when the user starts or ends editing the slider.
   */
  onEditingChanged?: (isEditing: boolean) => void;
} & CommonViewModifierProps;

type NativeSliderProps = Omit<
  SliderProps,
  'onValueChange' | 'onEditingChanged' | 'label' | 'minimumValueLabel' | 'maximumValueLabel'
> & {
  onValueChanged?: (event: NativeSyntheticEvent<{ value: number }>) => void;
  onEditingChanged?: (event: NativeSyntheticEvent<{ isEditing: boolean }>) => void;
  children?: React.ReactNode;
};

const SliderNativeView: React.ComponentType<NativeSliderProps> = requireNativeView(
  'ExpoUI',
  'SliderView'
);

const SliderValueLabelNativeView: React.ComponentType<{
  kind: 'label' | 'minimum' | 'maximum';
  children?: React.ReactNode;
}> = requireNativeView('ExpoUI', 'SliderLabelView');

function transformSliderProps(props: SliderProps): NativeSliderProps {
  const {
    label,
    minimumValueLabel,
    maximumValueLabel,
    onValueChange,
    onEditingChanged,
    ...restProps
  } = props;
  return {
    ...restProps,
    min: props.min,
    max: props.max,
    step: props.step,
    value: props.value,
    onValueChanged: onValueChange
      ? ({ nativeEvent: { value } }) => {
          onValueChange(value);
        }
      : undefined,
    onEditingChanged: onEditingChanged
      ? ({ nativeEvent: { isEditing } }) => {
          onEditingChanged(isEditing);
        }
      : undefined,
  };
}

export function Slider(props: SliderProps) {
  const { label, minimumValueLabel, maximumValueLabel } = props;

  return (
    <SliderNativeView {...transformSliderProps(props)}>
      {label && <SliderValueLabelNativeView kind="label">{label}</SliderValueLabelNativeView>}
      {minimumValueLabel && (
        <SliderValueLabelNativeView kind="minimum">{minimumValueLabel}</SliderValueLabelNativeView>
      )}
      {maximumValueLabel && (
        <SliderValueLabelNativeView kind="maximum">{maximumValueLabel}</SliderValueLabelNativeView>
      )}
    </SliderNativeView>
  );
}
