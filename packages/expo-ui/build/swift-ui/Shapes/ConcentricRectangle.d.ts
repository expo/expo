import { CommonViewModifierProps } from '../types';
export type CornerStyleConfig = {
    type: 'concentric';
    minimumRadius?: number;
} | {
    type: 'fixed';
    radius: number;
};
export interface ConcentricRectangleCornerParams {
    topLeadingCorner?: CornerStyleConfig;
    topTrailingCorner?: CornerStyleConfig;
    bottomLeadingCorner?: CornerStyleConfig;
    bottomTrailingCorner?: CornerStyleConfig;
}
export interface ConcentricRectangleProps extends CommonViewModifierProps {
    corners?: ConcentricRectangleCornerParams;
}
export declare const EdgeCornerStyle: {
    concentric: (minimumRadius?: number) => CornerStyleConfig;
    fixed: (radius: number) => CornerStyleConfig;
};
export declare function ConcentricRectangle(props: ConcentricRectangleProps): import("react").JSX.Element;
//# sourceMappingURL=ConcentricRectangle.d.ts.map