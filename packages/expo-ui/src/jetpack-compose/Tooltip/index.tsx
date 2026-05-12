import { requireNativeView } from 'expo';
import { type Ref } from 'react';
import { type ColorValue } from 'react-native';

import { type ModifierConfig } from '../../types';
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
   * When not specified, this is automatically derived from the presence of a `RichTooltip.Action` slot.
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
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
  /**
   * Children containing a `TooltipBox.PlainTooltip` or `TooltipBox.RichTooltip` slot and the anchor/trigger content.
   * The anchor content triggers the tooltip on long-press.
   */
  children: React.ReactNode;
};

const TooltipBoxNativeView: React.ComponentType<TooltipBoxProps> = requireNativeView(
  'ExpoUI',
  'TooltipBoxView'
);

const SlotNativeView: React.ComponentType<{ slotName: string; children: React.ReactNode }> =
  requireNativeView('ExpoUI', 'SlotView');

function transformProps(
  props: Omit<TooltipBoxProps, 'children'>
): Omit<TooltipBoxProps, 'children'> {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    isPersistent: props.isPersistent ?? false,
    enableUserInput: props.enableUserInput ?? true,
    focusable: props.focusable ?? false,
  };
}

// --- PlainTooltip (compound component of TooltipBox) ---

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
 * A simple tooltip. Place inside `TooltipBox` as `TooltipBox.PlainTooltip`.
 * Children become the tooltip content.
 */
function PlainTooltipComponent(props: PlainTooltipProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <SlotNativeView slotName="tooltip">
      <PlainTooltipNativeView
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        {...restProps}>
        {children}
      </PlainTooltipNativeView>
    </SlotNativeView>
  );
}

// --- RichTooltip (compound component of TooltipBox) ---

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
 * A detailed tooltip with optional title, body text, and action. Place inside `TooltipBox` as `TooltipBox.RichTooltip`.
 * Content is provided via sub-components: `TooltipBox.RichTooltip.Title`, `TooltipBox.RichTooltip.Text`, `TooltipBox.RichTooltip.Action`.
 */
function RichTooltipComponent(props: RichTooltipProps) {
  const { children, modifiers, ...restProps } = props;
  return (
    <SlotNativeView slotName="tooltip">
      <RichTooltipNativeView
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        {...restProps}>
        {children}
      </RichTooltipNativeView>
    </SlotNativeView>
  );
}

RichTooltipComponent.Title = RichTooltipTitle;
RichTooltipComponent.Text = RichTooltipText;
RichTooltipComponent.Action = RichTooltipAction;

// --- TooltipBox ---

/**
 * A container that wraps anchor content and shows a tooltip on long-press.
 * Provide the tooltip content via `TooltipBox.PlainTooltip` or `TooltipBox.RichTooltip`.
 * All other children are the anchor/trigger.
 *
 * Use `ref` to imperatively `show()` or `dismiss()` the tooltip.
 */
function TooltipBoxComponent(props: TooltipBoxProps) {
  const { children, ...restProps } = props;
  return <TooltipBoxNativeView {...transformProps(restProps)}>{children}</TooltipBoxNativeView>;
}

TooltipBoxComponent.PlainTooltip = PlainTooltipComponent;
TooltipBoxComponent.RichTooltip = RichTooltipComponent;

export { TooltipBoxComponent as TooltipBox };
