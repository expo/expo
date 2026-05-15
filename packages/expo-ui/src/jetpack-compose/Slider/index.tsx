import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import type { ModifierConfig, ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type SlotNativeViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotNativeViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Colors for slider elements. Maps directly to Material3's `SliderDefaults.colors()`.
 * @platform android
 */
export type SliderColors = {
  thumbColor?: ColorValue;
  activeTrackColor?: ColorValue;
  inactiveTrackColor?: ColorValue;
  activeTickColor?: ColorValue;
  inactiveTickColor?: ColorValue;
};

export type SliderProps = {
  /**
   * The current value of the slider.
   * @default 0
   */
  value?: number;
  /**
   * The number of steps between the minimum and maximum values, `0` signifies infinite steps.
   * @default 0
   */
  steps?: number;
  /**
   * The minimum value of the slider. Updating this value does not trigger callbacks if the current value is below `min`.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the slider. Updating this value does not trigger callbacks if the current value is above `max`.
   * @default 1
   */
  max?: number;
  /**
   * Lower limit the user can drag the thumb to. The visible track still
   * spans `min..max`, but the thumb stops at `lowerLimit` during drag.
   */
  lowerLimit?: number;
  /**
   * Upper limit the user can drag the thumb to. The visible track still
   * spans `min..max`, but the thumb stops at `upperLimit` during drag.
   */
  upperLimit?: number;
  /**
   * Whether the slider is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for slider elements. Maps to Material3's `SliderDefaults.colors()`.
   * @platform android
   */
  colors?: SliderColors;
  /**
   * Callback triggered on dragging along the slider.
   */
  onValueChange?: (value: number) => void;
  /**
   * Callback triggered when the user finishes changing the value (for example, lifts a finger).
   * Maps to Material3's `onValueChangeFinished`.
   */
  onValueChangeFinished?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Slot children for custom thumb and track.
   */
  children?: React.ReactNode;
};

type NativeSliderProps = Omit<SliderProps, 'onValueChange' | 'onValueChangeFinished' | 'children'> &
  ViewEvent<'onValueChange', { value: number }> &
  ViewEvent<'onValueChangeFinished', void> & { children?: React.ReactNode };

const SliderNativeView: React.ComponentType<NativeSliderProps> = requireNativeView(
  'ExpoUI',
  'SliderView'
);

function transformSliderProps(
  props: Omit<SliderProps, 'children'>
): Omit<NativeSliderProps, 'children'> {
  const { modifiers, onValueChange, onValueChangeFinished, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    min: props.min ?? 0,
    max: props.max ?? 1,
    steps: props.steps ?? 0,
    value: props.value ?? 0,
    enabled: props.enabled ?? true,
    onValueChange: onValueChange
      ? ({ nativeEvent: { value } }) => {
          onValueChange(value);
        }
      : undefined,
    onValueChangeFinished: onValueChangeFinished ? () => onValueChangeFinished() : undefined,
  };
}

/**
 * A custom thumb slot for `Slider`.
 * Wrap any content to use as the slider's thumb indicator.
 *
 * @platform android
 */
function Thumb(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="thumb">{props.children}</SlotNativeView>;
}

/**
 * A custom track slot for `Slider`.
 * Wrap any content to use as the slider's track.
 *
 * @platform android
 */
function Track(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="track">{props.children}</SlotNativeView>;
}

/**
 * A slider component that wraps Material3's `Slider`.
 *
 * @platform android
 */
function SliderComponent(props: SliderProps) {
  const { children, ...restProps } = props;
  return <SliderNativeView {...transformSliderProps(restProps)}>{children}</SliderNativeView>;
}

SliderComponent.Thumb = Thumb;
SliderComponent.Track = Track;

export { SliderComponent as Slider };
