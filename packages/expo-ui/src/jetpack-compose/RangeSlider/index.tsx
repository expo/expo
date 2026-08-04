import { requireNativeView } from 'expo';

import type { ModifierConfig, ViewEvent } from '../../types';
import type { SliderColors } from '../Slider';
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
 * The pair of values selected by a `RangeSlider`. Maps to Compose's `ClosedFloatingPointRange<Float>`.
 * @platform android
 */
export type RangeSliderValue = {
  /**
   * The value of the start thumb.
   */
  start: number;
  /**
   * The value of the end thumb.
   */
  end: number;
};

export interface RangeSliderProps {
  /**
   * The currently selected range. The two values are bounded by `min` and `max` and cannot cross each other.
   * @default { start: 0, end: 1 }
   */
  value?: RangeSliderValue;
  /**
   * The number of steps between the minimum and maximum values, `0` signifies infinite steps.
   * @default 0
   */
  steps?: number;
  /**
   * The minimum value of the range slider.
   * @default 0
   */
  min?: number;
  /**
   * The maximum value of the range slider.
   * @default 1
   */
  max?: number;
  /**
   * Whether the range slider is enabled for user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for range slider elements. Maps to Material3's `SliderDefaults.colors()`.
   */
  colors?: SliderColors;
  /**
   * Callback triggered on dragging either thumb.
   */
  onValueChange?: (value: RangeSliderValue) => void;
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
   * Slot children for custom thumbs and track.
   */
  children?: React.ReactNode;
}

type NativeRangeSliderProps = Omit<
  RangeSliderProps,
  'onValueChange' | 'onValueChangeFinished' | 'children'
> &
  ViewEvent<'onValueChange', RangeSliderValue> &
  ViewEvent<'onValueChangeFinished', void> & { children?: React.ReactNode };

const RangeSliderNativeView: React.ComponentType<NativeRangeSliderProps> = requireNativeView(
  'ExpoUI',
  'RangeSliderView'
);

function transformRangeSliderProps(
  props: Omit<RangeSliderProps, 'children'>
): Omit<NativeRangeSliderProps, 'children'> {
  const { modifiers, onValueChange, onValueChangeFinished, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    min: props.min ?? 0,
    max: props.max ?? 1,
    steps: props.steps ?? 0,
    value: props.value ?? { start: 0, end: 1 },
    enabled: props.enabled ?? true,
    onValueChange: onValueChange
      ? ({ nativeEvent: { start, end } }) => {
          onValueChange({ start, end });
        }
      : undefined,
    onValueChangeFinished: onValueChangeFinished ? () => onValueChangeFinished() : undefined,
  };
}

/**
 * A custom start thumb slot for `RangeSlider`.
 * Wrap any content to use as the lower thumb indicator.
 *
 * @platform android
 */
function StartThumb(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="startThumb">{props.children}</SlotNativeView>;
}

/**
 * A custom end thumb slot for `RangeSlider`.
 * Wrap any content to use as the upper thumb indicator.
 *
 * @platform android
 */
function EndThumb(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="endThumb">{props.children}</SlotNativeView>;
}

/**
 * A custom track slot for `RangeSlider`.
 * Wrap any content to use as the range slider's track.
 *
 * @platform android
 */
function Track(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="track">{props.children}</SlotNativeView>;
}

/**
 * A range slider component that wraps Material3's `RangeSlider`. It lets the user select two values
 * from a bounded range.
 *
 * @platform android
 */
function RangeSliderComponent(props: RangeSliderProps) {
  const { children, ...restProps } = props;
  return (
    <RangeSliderNativeView {...transformRangeSliderProps(restProps)}>
      {children}
    </RangeSliderNativeView>
  );
}

RangeSliderComponent.StartThumb = StartThumb;
RangeSliderComponent.EndThumb = EndThumb;
RangeSliderComponent.Track = Track;

export { RangeSliderComponent as RangeSlider };
