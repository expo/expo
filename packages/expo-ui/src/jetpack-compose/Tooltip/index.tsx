import { requireNativeView } from 'expo';
import { type Ref } from 'react';
import { type ColorValue } from 'react-native';

import { type ViewEvent, type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type TooltipBoxRef = {
  /**
   * Programmatically shows the tooltip.
   */
  show: () => Promise<void>;
  /**
   * Programmatically dismisses the tooltip.
   */
  dismiss: () => Promise<void>;
};

export type TooltipBoxProps = {
  /**
   * Ref to imperatively show/dismiss the tooltip.
   */
  ref?: Ref<TooltipBoxRef>;
  /**
   * Whether the tooltip persists instead of auto-dismissing after a short timeout.
   * @default false
   */
  isPersistent?: boolean;
  /**
   * Whether the tooltip contains an action. Affects accessibility and dismiss behavior.
   * @default false
   */
  hasAction?: boolean;
  /**
   * Whether user input (long-press, hover) triggers the tooltip.
   * @default true
   */
  enableUserInput?: boolean;
  /**
   * Whether the tooltip popup is focusable.
   * @default false
   */
  focusable?: boolean;
  /**
   * Callback when the tooltip is dismissed.
   */
  onDismissRequest?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing a `TooltipBox.Tooltip` slot and the anchor/trigger content.
   * The anchor content triggers the tooltip on long-press.
   */
  children: React.ReactNode;
};

type NativeTooltipBoxProps = Omit<TooltipBoxProps, 'onDismissRequest'> &
  ViewEvent<'onDismissRequest', void>;

const TooltipBoxNativeView: React.ComponentType<NativeTooltipBoxProps> = requireNativeView(
  'ExpoUI',
  'TooltipBoxView'
);

const SlotNativeView: React.ComponentType<{ slotName: string; children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'SlotView');

function transformProps(
  props: Omit<TooltipBoxProps, 'children'>
): Omit<NativeTooltipBoxProps, 'children'> {
  const { modifiers, onDismissRequest, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    isPersistent: props.isPersistent ?? false,
    hasAction: props.hasAction ?? false,
    enableUserInput: props.enableUserInput ?? true,
    focusable: props.focusable ?? false,
    onDismissRequest: onDismissRequest ? () => onDismissRequest() : undefined,
  };
}

/**
 * The tooltip slot of the `TooltipBox`. Pass a `PlainTooltip` or `RichTooltip` as a child.
 */
function TooltipBoxTooltip(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="tooltip">{props.children}</SlotNativeView>;
}

/**
 * A container that wraps anchor content and shows a tooltip on long-press.
 * Provide the tooltip content via the `TooltipBox.Tooltip`, containing either
 * a `PlainTooltip` or `RichTooltip`. All other children are the anchor/trigger.
 *
 * Use `ref` to imperatively `show()` or `dismiss()` the tooltip.
 */
function TooltipBoxComponent(props: TooltipBoxProps) {
  const { children, ...restProps } = props;
  return <TooltipBoxNativeView {...transformProps(restProps)}>{children}</TooltipBoxNativeView>;
}

TooltipBoxComponent.Tooltip = TooltipBoxTooltip;

export { TooltipBoxComponent as TooltipBox };

// --- PlainTooltip ---

export type PlainTooltipProps = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  modifiers?: ModifierConfig[];
  children: React.ReactNode;
};

const PlainTooltipNativeView: React.ComponentType<PlainTooltipProps> = requireNativeView(
  'ExpoUI',
  'PlainTooltipView'
);

/**
 * A simple tooltip. Place inside `TooltipBox.Tooltip`.
 * Children become the tooltip content.
 */
export function PlainTooltip(props: PlainTooltipProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <PlainTooltipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </PlainTooltipNativeView>
  );
}

// --- RichTooltip ---

export type RichTooltipProps = {
  containerColor?: ColorValue;
  contentColor?: ColorValue;
  titleContentColor?: ColorValue;
  actionContentColor?: ColorValue;
  modifiers?: ModifierConfig[];
  children: React.ReactNode;
};

const RichTooltipNativeView: React.ComponentType<RichTooltipProps> = requireNativeView(
  'ExpoUI',
  'RichTooltipView'
);

function RichTooltipTitle(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="title">{props.children}</SlotNativeView>;
}

function RichTooltipText(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="text">{props.children}</SlotNativeView>;
}

function RichTooltipAction(props: { children: React.ReactNode }) {
  return <SlotNativeView slotName="action">{props.children}</SlotNativeView>;
}

/**
 * A detailed tooltip with optional title, body text, and action. Place inside `TooltipBox.Tooltip`.
 * Content is provided via sub-components: `RichTooltip.Title`, `RichTooltip.Text`, `RichTooltip.Action`.
 */
function RichTooltipComponent(props: RichTooltipProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <RichTooltipNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {children}
    </RichTooltipNativeView>
  );
}

RichTooltipComponent.Title = RichTooltipTitle;
RichTooltipComponent.Text = RichTooltipText;
RichTooltipComponent.Action = RichTooltipAction;

export { RichTooltipComponent as RichTooltip };
