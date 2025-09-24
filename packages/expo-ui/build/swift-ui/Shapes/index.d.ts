import { type CommonViewModifierProps } from '../types';
export interface RectangleProps extends CommonViewModifierProps {
}
export declare function Rectangle(props: RectangleProps): import("react").JSX.Element;
export interface RoundedRectangleProps extends CommonViewModifierProps {
    cornerRadius?: number;
}
export declare function RoundedRectangle(props: RoundedRectangleProps): import("react").JSX.Element;
export interface EllipseProps extends CommonViewModifierProps {
}
export declare function Ellipse(props: EllipseProps): import("react").JSX.Element;
export interface UnevenRoundedRectangleProps extends CommonViewModifierProps {
    topLeadingRadius?: number;
    topTrailingRadius?: number;
    bottomLeadingRadius?: number;
    bottomTrailingRadius?: number;
}
export declare function UnevenRoundedRectangle(props: UnevenRoundedRectangleProps): import("react").JSX.Element;
export interface CapsuleProps extends CommonViewModifierProps {
    cornerStyle?: 'continuous' | 'circular';
}
export declare function Capsule(props: CapsuleProps): import("react").JSX.Element;
export interface CircleProps extends CommonViewModifierProps {
}
export declare function Circle(props: CircleProps): import("react").JSX.Element;
export * from './ConcentricRectangle';
//# sourceMappingURL=index.d.ts.map