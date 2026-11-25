import { requireNativeView } from 'expo';

import type { ModifierConfig, ViewEvent } from '../../types';
import type { SliderColors } from '../Slider';
import { createViewModifierEventListener } from '../modifiers/utils';

export type { SliderColors };

/**
 * An inclusive numeric range for `RangeSlider`.
 */
export type RangeSliderRange = {
  /** The start of the range. */
  start: number;
  /** The end of the range, included in the selection. */
  endInclusive: number;
};

export interface RangeSliderProps {
  /**
   * The selected start value. Changing this prop updates the native selection when the user is not dragging.
   * @default 0
   */
  startValue?: number;
  /**
   * The selected end value. Changing this prop updates the native selection when the user is not dragging.
   * @default 1
   */
  endValue?: number;
  /**
   * The bounds of the entire track. The slider clamps values outside these bounds.
   * @default \{ start: 0, endInclusive: 1 \}
   */
  trackRange?: RangeSliderRange;
  /**
   * The number of selectable positions between the track bounds.
   * Must be a nonnegative integer. `0` means continuous selection.
   * @default 0
   */
  steps?: number;
  /**
   * Whether the slider responds to user interaction.
   * @default true
   */
  enabled?: boolean;
  /**
   * Colors for the thumbs, track, and tick marks. Omitted colors use the Material theme.
   */
  colors?: SliderColors;
  /**
   * Called with both endpoints when the user changes the selection.
   */
  onValueChange?: (range: RangeSliderRange) => void;
  /**
   * Called when the user finishes changing the selection.
   * It has no value argument. `onValueChange` reports the selection.
   */
  onValueChangeFinished?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Custom content wrapped in `RangeSlider.StartThumb`, `RangeSlider.EndThumb`, or `RangeSlider.Track`.
   */
  children?: React.ReactNode;
}

type NativeRangeSliderProps = Omit<RangeSliderProps, 'onValueChange' | 'onValueChangeFinished'> &
  ViewEvent<'onValueChange', RangeSliderRange> &
  ViewEvent<'onValueChangeFinished', void>;

const RangeSliderNativeView: React.ComponentType<NativeRangeSliderProps> = requireNativeView(
  'ExpoUI',
  'RangeSliderView'
);

const SlotNativeView: React.ComponentType<{ slotName: string; children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'SlotView');

/**
 * Custom content for the start thumb of a `RangeSlider`.
 * @platform android
 */
function StartThumb(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="startThumb">{props.children}</SlotNativeView>;
}

/**
 * Custom content for the end thumb of a `RangeSlider`.
 * @platform android
 */
function EndThumb(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="endThumb">{props.children}</SlotNativeView>;
}

/**
 * Custom content for the track of a `RangeSlider`.
 * @platform android
 */
function Track(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="track">{props.children}</SlotNativeView>;
}

/**
 * A Material 3 slider for selecting two values on a bounded track.
 * It works only inside a `Host` component.
 * @platform android
 */
export function RangeSlider(props: RangeSliderProps) {
  const { modifiers, onValueChange, onValueChangeFinished, ...restProps } = props;
  return (
    <RangeSliderNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      onValueChange={onValueChange ? ({ nativeEvent }) => onValueChange(nativeEvent) : undefined}
      onValueChangeFinished={onValueChangeFinished ? () => onValueChangeFinished() : undefined}
    />
  );
}

RangeSlider.StartThumb = StartThumb;
RangeSlider.EndThumb = EndThumb;
RangeSlider.Track = Track;
