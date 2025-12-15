import { type CommonViewModifierProps } from '../types';
export type PopoverViewProps = {
    children: React.ReactNode;
    /**
     * Whether the popover is presented.
     */
    isPresented?: boolean;
    /**
     * A callback that is called when the `isPresented` state changes.
     */
    onIsPresentedChange?: (isPresented: boolean) => void;
    /**
     * The positioning anchor that defines the attachment point of the popover.
     */
    attachmentAnchor?: 'leading' | 'trailing' | 'center' | 'top' | 'bottom';
    /**
     * The edge of the `attachmentAnchor` that defines the location of the popover's arrow. The default is `none`, which results in the system allowing any arrow edge.
     * @default 'none'
     */
    arrowEdge?: 'leading' | 'trailing' | 'top' | 'bottom' | 'none';
} & CommonViewModifierProps;
declare function PopoverTrigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
declare function PopoverContent(props: {
    children: React.ReactNode;
    modifiers?: CommonViewModifierProps['modifiers'];
}): import("react").JSX.Element;
export declare function Popover(props: PopoverViewProps): import("react").JSX.Element;
export declare namespace Popover {
    var Trigger: typeof PopoverTrigger;
    var Content: typeof PopoverContent;
}
export {};
//# sourceMappingURL=index.d.ts.map