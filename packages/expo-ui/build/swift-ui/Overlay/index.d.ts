import { type Alignment, type CommonViewModifierProps } from '../types';
export interface OverlayProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * The alignment of the overlay content relative to the base content.
     * @default 'center'
     */
    alignment?: Alignment;
}
declare function OverlayContent(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Overlay(props: OverlayProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Overlay {
    var Content: typeof OverlayContent;
}
export {};
//# sourceMappingURL=index.d.ts.map