import { requireNativeView } from 'expo';

export type NamespaceProps = {
  /**
   * The ID of the namespace. You can generate one with the `useId` react hook.
   */
  id: string;

  children: React.ReactNode;
};

type NativeNamespaceProps = NamespaceProps;

const NativeNamespaceView: React.ComponentType<NativeNamespaceProps> = requireNativeView(
  'ExpoUI',
  'NamespaceView'
);

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
export function Namespace(props: NamespaceProps) {
  return <NativeNamespaceView {...props} />;
}
