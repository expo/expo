import { type Alignment, type CommonViewModifierProps } from '../types';
export type OverlayProps = {
    children: React.ReactNode;
    /**
     * The alignment of the overlay content relative to the trigger view.
     * @default 'center'
     */
    alignment?: Alignment;
} & CommonViewModifierProps;
declare function OverlayTrigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
declare function OverlayContent(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare function Overlay(props: OverlayProps): import("react").JSX.Element;
export declare namespace Overlay {
    var Trigger: typeof OverlayTrigger;
    var Content: typeof OverlayContent;
}
export {};
//# sourceMappingURL=index.d.ts.map