import { type Ref } from 'react';
import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
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
export type PlainTooltipProps = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    modifiers?: ModifierConfig[];
    children: React.ReactNode;
};
/**
 * A simple tooltip. Place inside `TooltipBox` as `TooltipBox.PlainTooltip`.
 * Children become the tooltip content.
 */
declare function PlainTooltipComponent(props: PlainTooltipProps): import("react/jsx-runtime").JSX.Element;
export type RichTooltipProps = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    titleContentColor?: ColorValue;
    actionContentColor?: ColorValue;
    modifiers?: ModifierConfig[];
    children: React.ReactNode;
};
declare function RichTooltipTitle(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
declare function RichTooltipText(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
declare function RichTooltipAction(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * A detailed tooltip with optional title, body text, and action. Place inside `TooltipBox` as `TooltipBox.RichTooltip`.
 * Content is provided via sub-components: `TooltipBox.RichTooltip.Title`, `TooltipBox.RichTooltip.Text`, `TooltipBox.RichTooltip.Action`.
 */
declare function RichTooltipComponent(props: RichTooltipProps): import("react/jsx-runtime").JSX.Element;
declare namespace RichTooltipComponent {
    var Title: typeof RichTooltipTitle;
    var Text: typeof RichTooltipText;
    var Action: typeof RichTooltipAction;
}
/**
 * A container that wraps anchor content and shows a tooltip on long-press.
 * Provide the tooltip content via `TooltipBox.PlainTooltip` or `TooltipBox.RichTooltip`.
 * All other children are the anchor/trigger.
 *
 * Use `ref` to imperatively `show()` or `dismiss()` the tooltip.
 */
declare function TooltipBoxComponent(props: TooltipBoxProps): import("react/jsx-runtime").JSX.Element;
declare namespace TooltipBoxComponent {
    var PlainTooltip: typeof PlainTooltipComponent;
    var RichTooltip: typeof RichTooltipComponent;
}
export { TooltipBoxComponent as TooltipBox };
//# sourceMappingURL=index.d.ts.map