export type NamespaceProps = {
    /**
     * The ID of the namespace. You can generate one with the `useId` react hook.
     */
    id: string;
    children: React.ReactNode;
};
/**
 * A component that provides a SwiftUI [`Namespace`](https://developer.apple.com/documentation/swiftui/namespace) to its children.
 *
 * @example
 * ```tsx
 * const namespaceId = React.useId();
 * return (
 *   <Namespace id={namespaceId}>
 *     <GlassEffectContainer>
 *       <Image
 *         systemName="paintbrush.fill"
 *         modifiers={[
 *           glassEffect({
 *             glass: {
 *               variant: 'clear',
 *             },
 *           }),
 *           glassEffectId('paintbrush', namespaceId),
 *         ]}
 *       />
 *     </GlassEffectContainer>
 *   </Namespace>
 * );
 * ```
 */
export declare function Namespace(props: NamespaceProps): import("react").JSX.Element;
//# sourceMappingURL=Namespace.d.ts.map