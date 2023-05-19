import type { Declaration, DimensionPercentageFor_LengthValue, Length, LengthValue, NumberOrPercentage } from 'lightningcss';
import type { RuntimeValue } from '../types';
type AddStyleProp = (property: string, value: unknown, options?: {
    shortHand?: boolean;
    append?: boolean;
}) => void;
type AddAnimationDefaultProp = (property: string, value: unknown[]) => void;
type AddContainerProp = (declaration: Extract<Declaration, {
    property: 'container' | 'container-name' | 'container-type';
}>) => void;
type AddTransitionProp = (declaration: Extract<Declaration, {
    property: 'transition-property' | 'transition-duration' | 'transition-delay' | 'transition-timing-function' | 'transition';
}>) => void;
export interface ParseDeclarationOptions {
    inlineRem?: number | false;
    addStyleProp: AddStyleProp;
    addAnimationProp: AddAnimationDefaultProp;
    addContainerProp: AddContainerProp;
    addTransitionProp: AddTransitionProp;
    requiresLayout: () => void;
}
export declare function parseDeclaration(declaration: Declaration, options: ParseDeclarationOptions): void;
export declare function parseLength(length: number | Length | DimensionPercentageFor_LengthValue | NumberOrPercentage | LengthValue, options: ParseDeclarationOptions): number | string | RuntimeValue | undefined;
export {};
//# sourceMappingURL=parseDeclaration.d.ts.map