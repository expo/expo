import type { UnitPointValue } from '.';
import { type ObservableState } from '../../State/useNativeState';
/**
 * Attaches a stable identifier to a view so it can be referenced by scroll target bindings.
 * Use with `scrollTargetLayout()` on the containing stack and the `scrollPosition` modifier on a scrollable container.
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/id(_:)).
 */
export declare const id: (value: string) => import("./createModifier").ModifierConfig;
/**
 * Binds the leading scroll target of a scrollable container to an observable native state.
 *
 * Reading `state.value` returns the id of the leading scroll target. Writing to it scrolls
 * the container to the matching view. Pair with `scrollTargetLayout()` on the content
 * container and `id()` on each target. Works on `ScrollView`, `LazyVStack`, `LazyHStack`,
 * and other scrollable containers.
 *
 * On iOS below 17.0, the modifier is a no-op.
 *
 * @param state - An `ObservableState<string | null>` created with `useNativeState`.
 * @param options.anchor - Anchor used to pick which view drives the binding and to align
 *   programmatic scrolls. Maps to the `anchor:` parameter of SwiftUI's `.scrollPosition(id:anchor:)`.
 * @param options.onChange - Fires on the JS thread whenever the leading scroll target changes.
 *
 * @platform ios 17.0+
 * @platform tvos 17.0+
 * @platform macos 14.0+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/scrollposition(id:anchor:)).
 *
 * @example
 * ```tsx
 * const activeID = useNativeState<string | null>(null);
 *
 * <ScrollView
 *   modifiers={[
 *     scrollPosition(activeID, {
 *       anchor: 'center',
 *       onChange: (newID) => console.log('leading target:', newID),
 *     }),
 *   ]}>
 *   <VStack modifiers={[scrollTargetLayout()]}>
 *     {items.map((item) => (
 *       <Text key={item.id} modifiers={[id(item.id)]}>{item.text}</Text>
 *     ))}
 *   </VStack>
 * </ScrollView>
 * ```
 */
export declare const scrollPosition: (state: ObservableState<string | null>, options?: {
    anchor?: UnitPointValue;
    onChange?: (id: string | null) => void;
}) => import("./createModifier").ModifierConfig;
//# sourceMappingURL=scrollPosition.d.ts.map