import { requireNativeView } from 'expo';
import type { Ref, ReactNode, ComponentType } from 'react';
import type { ColorValue } from 'react-native';

import { PresentedContent } from '../../PresentedContentContext';
import { type ModifierConfig } from '../../types';
import type { PaddingValuesRecord } from '../Carousel';
import { createViewModifierEventListener } from '../modifiers/utils';

export type { PaddingValuesRecord };

type SlotNativeViewProps = {
  slotName: string;
  children: ReactNode;
};

const SlotNativeView: ComponentType<SlotNativeViewProps> = requireNativeView('ExpoUI', 'SlotView');

export type ModalBottomSheetRef = {
  /**
   * Programmatically hides the bottom sheet with an animation.
   * The returned promise resolves after the dismiss animation completes.
   */
  hide: () => Promise<void>;
  /**
   * Programmatically expands the bottom sheet to full height with an animation.
   */
  expand: () => Promise<void>;
  /**
   * Programmatically collapses the bottom sheet to partially expanded (~50%) state.
   * Only works when `skipPartiallyExpanded` is `false`.
   */
  partialExpand: () => Promise<void>;
};

export type ModalBottomSheetProperties = {
  /**
   * Whether the bottom sheet can be dismissed by pressing the back button.
   * @default true
   */
  shouldDismissOnBackPress?: boolean;
  /**
   * Whether the bottom sheet can be dismissed by clicking outside (on the scrim).
   * @default true
   */
  shouldDismissOnClickOutside?: boolean;
};

export interface ModalBottomSheetProps {
  /**
   * The children of the `ModalBottomSheet` component.
   * Can include `ModalBottomSheet.DragHandle` and `ModalBottomSheet.Footer` slots.
   */
  children: ReactNode;
  /**
   * Can be used to imperatively hide the bottom sheet with an animation.
   */
  ref?: Ref<ModalBottomSheetRef>;
  /**
   * Callback function that is called when the user dismisses the bottom sheet
   * (via swipe, back press, or tapping outside the scrim).
   */
  onDismissRequest: () => void;
  /**
   * Immediately opens the bottom sheet in full screen.
   * @default false
   */
  skipPartiallyExpanded?: boolean;
  /**
   * Opens the sheet fully expanded on first composition. Ignored when `skipPartiallyExpanded` is `true`.
   * @default false
   * @platform android
   */
  initialFullyExpanded?: boolean;
  /**
   * Whether the sheet sizes itself to its content, including the footer when provided.
   * Set to `false` to fill the available height.
   * Content that fills the available height still fills the sheet when this is `true`.
   * @default true
   * @platform android
   */
  fitToContents?: boolean;
  /**
   * The background color of the bottom sheet.
   */
  containerColor?: ColorValue;
  /**
   * The preferred color of the content inside the bottom sheet.
   */
  contentColor?: ColorValue;
  /**
   * The color of the scrim overlay behind the bottom sheet.
   */
  scrimColor?: ColorValue;
  /**
   * Whether to show the default drag handle at the top of the bottom sheet.
   * Ignored if a custom `ModalBottomSheet.DragHandle` slot is provided.
   * @default true
   */
  showDragHandle?: boolean;
  /**
   * Whether gestures (swipe to dismiss) are enabled on the bottom sheet.
   * @default true
   */
  sheetGesturesEnabled?: boolean;
  /**
   * Insets in dp that the sheet adds around its content. Missing sides are `0`.
   * When omitted, the sheet uses `BottomSheetDefaults.modalWindowInsets`, which pads the
   * top and bottom of the content clear of the system bars, display cutouts, and the
   * keyboard, so scrolling content stops above the navigation bar.
   * Pass `{ top: insets.top }`, with `insets` from `react-native-safe-area-context`, to let
   * the content run under the navigation bar and pad its own end instead. The sheet then
   * adds no padding for the keyboard.
   */
  contentWindowInsets?: PaddingValuesRecord;
  /**
   * Properties for the modal window behavior.
   */
  properties?: ModalBottomSheetProperties;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
}

type NativeModalBottomSheetProps = Omit<ModalBottomSheetProps, 'onDismissRequest'> & {
  onDismissRequest: () => void;
};

const ModalBottomSheetNativeView: ComponentType<NativeModalBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'ModalBottomSheetView'
);

function transformProps(props: ModalBottomSheetProps): NativeModalBottomSheetProps {
  const { modifiers, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    skipPartiallyExpanded: props.skipPartiallyExpanded ?? false,
    initialFullyExpanded: props.initialFullyExpanded ?? false,
    fitToContents: props.fitToContents ?? true,
    onDismissRequest: () => {
      onDismissRequest?.();
    },
  };
}

/**
 * A custom drag handle slot for `ModalBottomSheet`.
 * Wrap any content to use as the sheet's drag handle.
 *
 * @platform android
 */
function DragHandle(props: { children: ReactNode }) {
  return <SlotNativeView slotName="dragHandle">{props.children}</SlotNativeView>;
}

/**
 * A Material Design modal bottom sheet.
 */
function ModalBottomSheetComponent(props: ModalBottomSheetProps) {
  const { children, ...rest } = props;
  // The whole sheet, drag handle included, is presented in its own window, so all of it is marked.
  return (
    <ModalBottomSheetNativeView {...transformProps(rest as ModalBottomSheetProps)}>
      <PresentedContent>{children}</PresentedContent>
    </ModalBottomSheetNativeView>
  );
}

/**
 * A footer pinned to the visible bottom of the sheet, within its `contentWindowInsets`.
 * The main content receives the remaining visible height in either sizing mode.
 * With `fitToContents={true}`, the footer also contributes to the sheet's measured content height.
 *
 * @platform android
 */
function Footer(props: { children: ReactNode }) {
  return <SlotNativeView slotName="footer">{props.children}</SlotNativeView>;
}

ModalBottomSheetComponent.DragHandle = DragHandle;
ModalBottomSheetComponent.Footer = Footer;

export const ModalBottomSheet = ModalBottomSheetComponent;
