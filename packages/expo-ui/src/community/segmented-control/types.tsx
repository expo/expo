import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Shape of the native event passed to `onChange`.
 * Matches `@react-native-segmented-control/segmented-control`.
 */
export type NativeSegmentedControlChangeEvent = {
  nativeEvent: {
    selectedSegmentIndex: number;
    value: string;
  };
};

/**
 * Shape of the native event passed to `onChange`.
 * Matches `@react-native-segmented-control/segmented-control`.
 * @deprecated use NativeSegmentedControlChangeEvent
 */
export type NativeSegmentedControlIOSChangeEvent = NativeSegmentedControlChangeEvent;

export type SegmentedControlProps = {
  /**
   * The labels for the control's segment buttons, in order.
   */
  values?: string[];
  /**
   * The index of the selected segment.
   */
  selectedIndex?: number;
  /**
   * If `false`, the user cannot interact with the control.
   * @default true
   */
  enabled?: boolean;
  /**
   * Called when the user taps a segment.
   * The event carries `nativeEvent.selectedSegmentIndex` and `nativeEvent.value`.
   */
  onChange?: (event: NativeSegmentedControlChangeEvent) => void;
  /**
   * Called when the user taps a segment. Receives the segment's string value.
   */
  onValueChange?: (value: string) => void;
  /**
   * Accent color of the control.
   * @platform android, web
   */
  tintColor?: string;
  /**
   * Overrides the control's appearance irrespective of the system theme.
   */
  appearance?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Builds a synthetic `onChange` event matching the community library shape.
 */
export function buildChangeEvent(index: number, value: string): NativeSegmentedControlChangeEvent {
  return {
    nativeEvent: {
      selectedSegmentIndex: index,
      value,
    },
  };
}
