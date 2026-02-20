import { type ReactNode } from 'react';
/**
 * Defines the target for an Apple zoom transition.
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 *
 * export default function Screen() {
 *  return (
 *   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
 *    <Link.AppleZoomTarget>
 *      <Image source={require('../assets/image.png')} style={{ width: 200, height: 200 }} />
 *    </Link.AppleZoomTarget>
 *   </View>
 *  );
 * }
 * ```
 *
 * @platform ios 18+
 */
export declare function LinkAppleZoomTarget({ children }: {
    children?: ReactNode;
}): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
//# sourceMappingURL=link-apple-zoom-target.d.ts.map