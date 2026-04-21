import { type ReactNode } from 'react';
import { type ContentAlignment, type PrimitiveBaseProps } from '../layout-types';
export type MaskProps = {
    children?: ReactNode;
    /**
     * Alignment of the mask content within the masked view's bounds.
     * @default 'center'
     */
    alignment?: ContentAlignment;
} & PrimitiveBaseProps;
/**
 * Defines the mask shape applied to `Mask`'s other children. Only opaque pixels
 * of `Mask.Content` are kept; transparent pixels are erased. Exactly one
 * `Mask.Content` should be supplied per `Mask`.
 */
declare function MaskContent(props: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Masks its children using the shape provided via `Mask.Content`.
 *
 * Children of `Mask` are the content being masked; the (single) `Mask.Content`
 * child defines the mask itself — the masked content is visible only where
 * `Mask.Content` is opaque.
 *
 * @example
 * ```tsx
 * <Mask>
 *   <Box modifiers={[size(200, 80), background('#FF3B30')]} />
 *   <Mask.Content>
 *     <Text style={{ fontSize: 64, fontWeight: 'bold' }}>EXPO</Text>
 *   </Mask.Content>
 * </Mask>
 * ```
 */
export declare function Mask(props: MaskProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Mask {
    var Content: typeof MaskContent;
}
export {};
//# sourceMappingURL=index.d.ts.map