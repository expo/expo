import { type Alignment, type CommonViewModifierProps } from '../types';
export interface BackgroundProps extends CommonViewModifierProps {
    children: React.ReactNode;
    /**
     * The alignment of the background content relative to the base content.
     * @default 'center'
     */
    alignment?: Alignment;
}
declare function BackgroundContent(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Background(props: BackgroundProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Background {
    var Content: typeof BackgroundContent;
}
export {};
//# sourceMappingURL=index.d.ts.map