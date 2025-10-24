import { type CommonViewModifierProps } from '../types';
export type PopoverViewProps = {
    children: React.ReactNode;
    /**
     * A binding to a Boolean value that determines whether to present the popover content that you return from the modifier’s content closure.
     */
    isPresented?: boolean;
    onStateChange?: (event: {
        isPresented: boolean;
    }) => void;
    /**
     * The positioning anchor that defines the attachment point of the popover.
     */
    attachmentAnchor?: 'leading' | 'trailing' | 'center' | 'top' | 'bottom';
    /**
     * The edge of the attachmentAnchor that defines the location of the popover’s arrow. The default is nil, which results in the system allowing any arrow edge.
     * @default 'none'
     */
    arrowEdge?: 'leading' | 'trailing' | 'top' | 'bottom' | 'none';
} & CommonViewModifierProps;
export declare function PopoverTrigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare function PopoverContent(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare function Popover(props: PopoverViewProps): import("react").JSX.Element;
export declare namespace Popover {
    var Trigger: typeof PopoverTrigger;
    var Content: typeof PopoverContent;
}
//# sourceMappingURL=index.d.ts.map