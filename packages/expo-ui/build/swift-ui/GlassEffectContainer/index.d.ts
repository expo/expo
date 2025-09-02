import { type CommonViewModifierProps } from '../types';
export type GlassEffectContainerProps = {
    /**
     * The children of the `GlassEffectContainer` component.
     * These should be views with `.glassEffect()` modifiers applied.
     */
    children: React.ReactNode;
    /**
     * The spacing between glass elements in the container.
     * This controls how close elements need to be to start blending together.
     */
    spacing?: number;
} & CommonViewModifierProps;
export declare function GlassEffectContainer(props: GlassEffectContainerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map