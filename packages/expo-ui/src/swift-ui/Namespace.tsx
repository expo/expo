import { requireOptionalNative } from 'expo';

export interface NamespaceProps {
  /**
   * The ID of the namespace. You can generate one with the `useId` react hook.
   */
  id: string;

  children: React.ReactNode;
}

type NativeNamespaceProps = NamespaceProps;

// `expo.packages` exists only on iOS, and other platforms can import this file.
const NativeNamespaceView: React.ComponentType<NativeNamespaceProps> =
  requireOptionalNative('@expo/ui')?.NamespaceView;

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
