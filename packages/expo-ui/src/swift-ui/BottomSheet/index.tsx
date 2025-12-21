import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type PresentationDetent = 'medium' | 'large' | number;
export type PresentationDragIndicatorVisibility = 'automatic' | 'visible' | 'hidden';
export type PresentationBackgroundInteraction =
  | 'automatic'
  | 'enabled'
  | 'disabled'
  | {
      type: 'enabledUpThrough';
      detent: PresentationDetent;
    };

export type BottomSheetProps = {
  /**
   * The children of the `BottomSheet` component.
   */
  children: any;
  /**
   * Whether the `BottomSheet` is opened.
   */
  isOpened: boolean;
  /**
   * Callback function that is called when the `BottomSheet` is opened.
   */
  onIsOpenedChange: (isOpened: boolean) => void;
  /**
   * Setting it to `true` will disable the interactive dismiss of the `BottomSheet`.
   */
  interactiveDismissDisabled?: boolean;
  /**
   * Array of presentation detents for the `BottomSheet`.
   * Controls the heights that the sheet can snap to.
   * - `medium` - Medium height sheet
   * - `large` - Full height sheet
   * - number (0-1) - Fraction of screen height (for example, 0.4 equals to 40% of screen)
   */
  presentationDetents?: PresentationDetent[];
  /**
   * Controls the visibility of the drag indicator for the `BottomSheet`.
   * - `automatic` - System decides based on context (default)
   * - `visible` - Always show the drag indicator
   * - `hidden` - Never show the drag indicator
   */
  presentationDragIndicator?: PresentationDragIndicatorVisibility;
  /**
   * Controls how interactions on the dimmed background are handled while the sheet is visible.
   * - `automatic` - System decides the interaction behavior (default)
   * - `enabled` - Allow touches to pass through to the presenting view
   * - `disabled` - Prevent interactions with the presenting view
   * - `{ type: 'enabledUpThrough', detent: <detent> }` - Enable interactions while the sheet is expanded up through the specified detent
   */
  presentationBackgroundInteraction?: PresentationBackgroundInteraction;
} & CommonViewModifierProps;

type NativePresentationDetent =
  | { preset: Extract<PresentationDetent, 'medium' | 'large'> }
  | { fraction: number };

type NativePresentationBackgroundInteraction =
  | { type: 'automatic' | 'enabled' | 'disabled' }
  | {
      type: 'enabledUpThrough';
      detent?: NativePresentationDetent;
    };

type NativeBottomSheetProps = Omit<
  BottomSheetProps,
  'onIsOpenedChange' | 'presentationBackgroundInteraction'
> & {
  onIsOpenedChange: (event: NativeSyntheticEvent<{ isOpened: boolean }>) => void;
  presentationBackgroundInteraction?: NativePresentationBackgroundInteraction;
};

const BottomSheetNativeView: React.ComponentType<NativeBottomSheetProps> = requireNativeView(
  'ExpoUI',
  'BottomSheetView'
);

function transformBottomSheetProps(props: BottomSheetProps): NativeBottomSheetProps {
  const { modifiers, presentationBackgroundInteraction, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    presentationBackgroundInteraction: transformPresentationBackgroundInteraction(
      presentationBackgroundInteraction
    ),
    onIsOpenedChange: ({ nativeEvent: { isOpened } }) => {
      props?.onIsOpenedChange?.(isOpened);
    },
  };
}

function transformPresentationBackgroundInteraction(
  value?: PresentationBackgroundInteraction
): NativePresentationBackgroundInteraction | undefined {
  if (!value) {
    return undefined;
  }

  if (value === 'automatic' || value === 'enabled' || value === 'disabled') {
    return { type: value };
  }

  return {
    type: value.type,
    detent: transformPresentationDetent(value.detent),
  };
}

function transformPresentationDetent(
  detent?: PresentationDetent
): NativePresentationDetent | undefined {
  if (typeof detent === 'number') {
    return { fraction: detent };
  }

  if (detent === 'medium' || detent === 'large') {
    return { preset: detent };
  }

  return undefined;
}

export function BottomSheet(props: BottomSheetProps) {
  return <BottomSheetNativeView {...transformBottomSheetProps(props)} />;
}
