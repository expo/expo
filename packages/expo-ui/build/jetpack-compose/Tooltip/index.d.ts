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
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing a `TooltipBox.Tooltip` slot and the anchor/trigger content.
     * The anchor content triggers the tooltip on long-press.
     */
    children: React.ReactNode;
};
/**
 * The tooltip slot of the `TooltipBox`. Pass a `PlainTooltip` or `RichTooltip` as a child.
 */
declare function TooltipBoxTooltip(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * A container that wraps anchor content and shows a tooltip on long-press.
 * Provide the tooltip content via the `TooltipBox.Tooltip`, containing either
 * a `PlainTooltip` or `RichTooltip`. All other children are the anchor/trigger.
 *
 * Use `ref` to imperatively `show()` or `dismiss()` the tooltip.
 */
declare function TooltipBoxComponent(props: TooltipBoxProps): import("react").JSX.Element;
declare namespace TooltipBoxComponent {
    var Tooltip: typeof TooltipBoxTooltip;
}
export { TooltipBoxComponent as TooltipBox };
export type PlainTooltipProps = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    modifiers?: ModifierConfig[];
    children: React.ReactNode;
};
/**
 * A simple tooltip. Place inside `TooltipBox.Tooltip`.
 * Children become the tooltip content.
 */
export declare function PlainTooltip(props: PlainTooltipProps): import("react").JSX.Element;
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
}): import("react").JSX.Element;
declare function RichTooltipText(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
declare function RichTooltipAction(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * A detailed tooltip with optional title, body text, and action. Place inside `TooltipBox.Tooltip`.
 * Content is provided via sub-components: `RichTooltip.Title`, `RichTooltip.Text`, `RichTooltip.Action`.
 */
declare function RichTooltipComponent(props: RichTooltipProps): import("react").JSX.Element;
declare namespace RichTooltipComponent {
    var Title: typeof RichTooltipTitle;
    var Text: typeof RichTooltipText;
    var Action: typeof RichTooltipAction;
}
export { RichTooltipComponent as RichTooltip };
//# sourceMappingURL=index.d.ts.map