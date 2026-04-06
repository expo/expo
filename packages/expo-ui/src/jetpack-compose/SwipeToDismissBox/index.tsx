import { requireNativeView } from 'expo';

import { type ModifierConfig, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

type StartToEndEvent = ViewEvent<'onStartToEnd', Record<string, never>>;
type EndToStartEvent = ViewEvent<'onEndToStart', Record<string, never>>;

type NativeSwipeToDismissBoxProps = {
  enableDismissFromStartToEnd?: boolean;
  enableDismissFromEndToStart?: boolean;
  gesturesEnabled?: boolean;
  positionalThreshold?: number;
  modifiers?: ModifierConfig[];
  children?: React.ReactNode;
} & StartToEndEvent &
  EndToStartEvent;

export type SwipeToDismissBoxProps = {
  /**
   * Whether to allow dismissing by swiping from start to end (left-to-right in LTR).
   * @default true
   */
  enableDismissFromStartToEnd?: boolean;
  /**
   * Whether to allow dismissing by swiping from end to start (right-to-left in LTR).
   * @default true
   */
  enableDismissFromEndToStart?: boolean;
  /**
   * Whether swipe gestures are enabled.
   * @default true
   */
  gesturesEnabled?: boolean;
  /**
   * Fraction of the total swipe distance (0.0–1.0) the user must drag before the dismiss action triggers.
   * @default 0.5
   */
  positionalThreshold?: number;
  /**
   * Callback when the item is swiped from start to end.
   */
  onStartToEnd?: () => void;
  /**
   * Callback when the item is swiped from end to start.
   */
  onEndToStart?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing the main content and the optional `BackgroundContent` slot.
   */
  children?: React.ReactNode;
};

type SlotProps = {
  slotName: string;
  children: React.ReactNode;
};

const SwipeToDismissBoxNativeView: React.ComponentType<NativeSwipeToDismissBoxProps> =
  requireNativeView('ExpoUI', 'SwipeToDismissBoxView');

const SlotNativeView: React.ComponentType<SlotProps> = requireNativeView('ExpoUI', 'SlotView');

/**
 * Content shown behind the main content when swiping in either direction.
 * Used as a fallback when direction-specific slots are not provided.
 */
function BackgroundContent(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="backgroundContent">{props.children}</SlotNativeView>;
}

/**
 * Content shown behind the main content when swiping from start to end (left-to-right in LTR).
 * Overrides `BackgroundContent` for this direction.
 */
function BackgroundStartToEnd(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="backgroundStartToEnd">{props.children}</SlotNativeView>;
}

/**
 * Content shown behind the main content when swiping from end to start (right-to-left in LTR).
 * Overrides `BackgroundContent` for this direction.
 */
function BackgroundEndToStart(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="backgroundEndToStart">{props.children}</SlotNativeView>;
}

/**
 * A swipe-to-dismiss container matching Compose's `SwipeToDismissBox`.
 * Wraps any content (for example, a ListItem) and provides swipe gestures.
 *
 * @see [Jetpack Compose SwipeToDismissBox](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/swipe-to-dismiss)
 */
function SwipeToDismissBoxComponent(props: SwipeToDismissBoxProps) {
  const { children, onStartToEnd, onEndToStart, modifiers, ...restProps } = props;
  return (
    <SwipeToDismissBoxNativeView
      {...restProps}
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      onStartToEnd={onStartToEnd ? () => onStartToEnd() : undefined}
      onEndToStart={onEndToStart ? () => onEndToStart() : undefined}>
      {children}
    </SwipeToDismissBoxNativeView>
  );
}

SwipeToDismissBoxComponent.BackgroundContent = BackgroundContent;
SwipeToDismissBoxComponent.BackgroundStartToEnd = BackgroundStartToEnd;
SwipeToDismissBoxComponent.BackgroundEndToStart = BackgroundEndToStart;

export { SwipeToDismissBoxComponent as SwipeToDismissBox };
