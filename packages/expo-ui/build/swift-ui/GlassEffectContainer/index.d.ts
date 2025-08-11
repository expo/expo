import { StyleProp, ViewStyle } from 'react-native';
export type GlassEffectContainerProps = {
    /**
     * The children of the `GlassEffectContainer` component.
     * These should be views with `.glassEffect()` modifiers applied.
     */
    children: React.ReactNode;
    /**
     * The spacing between glass elements in the container.
     * This controls how close elements need to be to start blending together.
     * @default 0
     */
    spacing?: number;
};
/**
 * @hidden
 */
export type NativeGlassEffectContainerProps = GlassEffectContainerProps;
/**
 * `<GlassEffectContainer>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export declare function GlassEffectContainerPrimitive(props: GlassEffectContainerProps): import("react").JSX.Element;
/**
 * A container that combines multiple Liquid Glass shapes into a single shape
 * that can morph individual shapes into one another.
 *
 * Use this container to group multiple glass elements and ensure consistent
 * visual results. Glass elements within the container will blend together
 * when they are close, creating fluid morphing and separation effects.
 *
 * @example
 * ```tsx
 * <GlassEffectContainer spacing={40}>
 *   <HStack spacing={40}>
 *     <Image systemName="scribble.variable" glassEffect />
 *     <Image systemName="eraser.fill" glassEffect />
 *   </HStack>
 * </GlassEffectContainer>
 * ```
 */
export declare function GlassEffectContainer(props: GlassEffectContainerProps & {
    style?: StyleProp<ViewStyle>;
}): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map