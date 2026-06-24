import { type Alignment, type CommonViewModifierProps } from '../types';
export interface MaskProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * The alignment of the mask content relative to the base content.
     * @default 'center'
     */
    alignment?: Alignment;
}
declare function MaskContent(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Mask(props: MaskProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Mask {
    var Content: typeof MaskContent;
}
export {};
//# sourceMappingURL=index.d.ts.map