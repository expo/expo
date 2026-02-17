import { ExpoModifier } from '../../types';
export type SpacerProps = {
    /**
     * Modifiers for the component. Use weight() modifier to make the spacer flexible.
     */
    modifiers?: ExpoModifier[];
};
/**
 * A spacer component that fills available space.
 * Use with the weight() modifier to create flexible spacing in Row or Column layouts.
 *
 * @example
 * ```tsx
 * <Row>
 *   <Text>Left</Text>
 *   <Spacer modifiers={[weight(1)]} />
 *   <Text>Right</Text>
 * </Row>
 * ```
 */
export declare function Spacer(props: SpacerProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map