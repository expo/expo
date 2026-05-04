import { type ContentAlignment, type FloatingToolbarExitAlwaysScrollBehavior, type PrimitiveBaseProps } from '../layout-types';
import { type BlendMode } from '../modifiers';
export type BoxProps = {
    children?: React.ReactNode;
    /**
     * Alignment of children within the box.
     */
    contentAlignment?: ContentAlignment;
    /**
     * Scroll behavior for the floating toolbar exit.
     */
    floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
    /**
     * Declares that this `Box` hosts a Compose `GraphicsLayer` that descendants
     * can record into via the `recordLayer()` modifier. After children render,
     * the hosted layer is composited on top of the box's content using
     * `blendMode`.
     *
     * When `blendMode` is anything other than `'srcOver'`, the box automatically
     * applies `Modifier.graphicsLayer { compositingStrategy = Offscreen }` so the
     * blend happens in an offscreen buffer — no need to add it to `modifiers`
     * yourself.
     *
     * @example
     * ```tsx
     * <Box hostsLayer={{ blendMode: 'dstIn' }}>
     *   <Image source={...} />
     *   <Box modifiers={[matchParentSize(), recordLayer()]}>
     *     <Shape.Circle ... />
     *   </Box>
     * </Box>
     * ```
     */
    hostsLayer?: {
        blendMode?: BlendMode;
    };
} & PrimitiveBaseProps;
export declare function Box(props: BoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map