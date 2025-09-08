import { requireNativeView } from 'expo';
const NativeNamespaceView = requireNativeView('ExpoUI', 'NamespaceView');
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
export function Namespace(props) {
    return <NativeNamespaceView {...props}/>;
}
//# sourceMappingURL=Namespace.js.map