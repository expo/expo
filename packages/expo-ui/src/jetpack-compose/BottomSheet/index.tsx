import { requireNativeView } from 'expo';
import React from 'react';
import { NativeSyntheticEvent } from 'react-native';

/**
 * Presentation detent type for controlling sheet heights.
 * - `'medium'`: System medium height (approximately half screen)
 * - `'large'`: System large height (full screen)
 * - `{ fraction: number }`: Fraction of screen height (0-1)
 * - `{ height: number }`: Fixed height in dp
 */
export type PresentationDetent = 'medium' | 'large' | { fraction: number } | { height: number };

export type BottomSheetProps = {
  /**
   * The children of the `BottomSheet` component.
   */
  children: React.ReactNode;
  /**
   * Whether the `BottomSheet` is opened.
   */
  isOpened: boolean;
  /**
   * Callback function that is called when the `BottomSheet` is opened.
   */
  onIsOpenedChange: (isOpened: boolean) => void;
  /**
   * Immediately opens the bottom sheet in full screen.
   */
  skipPartiallyExpanded?: boolean;
  /**
   * When `true`, the sheet automatically sizes itself to fit its content.
   * @default false
   */
  fitToContents?: boolean;
  /**
   * Available detents (heights) for the bottom sheet.
   */
  detents?: PresentationDetent[];
  /**
   * The currently selected detent. Defaults to the first detent in the array.
   */
  selectedDetent?: PresentationDetent;
  /**
   * Callback fired when the active detent changes (e.g., user drags the sheet).
   */
  onSelectedDetentChange?: (detent: PresentationDetent) => void;
  /**
   * Background color of the bottom sheet container.
   * Accepts a CSS color string (e.g. `'#ffffff'`, `'red'`, `'rgba(0,0,0,0.5)'`).
   * @default '#ffffff'
   * @platform android
   */
  containerColor?: string;
};

type NativeBottomSheetProps = Omit<
  BottomSheetProps,
  'onIsOpenedChange' | 'onSelectedDetentChange'
> & {
  onIsOpenedChange: (event: NativeSyntheticEvent<{ isOpened: boolean }>) => void;
  onSelectedDetentChange?: (
    event: NativeSyntheticEvent<{ selectedDetentIndex: number }>
  ) => void;
  skipPartiallyExpanded: boolean;
};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  return {
    ...props,
    skipPartiallyExpanded: props.fitToContents ? false : (props.skipPartiallyExpanded ?? false),
    onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
      props.onIsOpenedChange(isOpened);
    },
    onSelectedDetentChange:
      props.onSelectedDetentChange && props.detents
        ? ({ nativeEvent: { selectedDetentIndex } }) => {
            const detent = props.detents![selectedDetentIndex];
            if (detent !== undefined) {
              props.onSelectedDetentChange!(detent);
            }
          }
        : undefined,
  };
}

export function BottomSheet(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}
