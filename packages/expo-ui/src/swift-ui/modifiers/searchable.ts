import { getStateId, type ObservableState } from '../../State';
import { createModifier, createModifierWithEventListener } from './createModifier';

/**
 * Placement of the search field created by the `searchable` modifier.
 *
 * - `automatic`: the system picks the placement for the current context.
 * - `toolbar`: the search field is placed in the toolbar.
 * - `sidebar`: the search field is placed in the sidebar of a navigation split view.
 *   Falls back to `automatic` on tvOS.
 * - `navigationBarDrawer`: the search field is placed in a drawer below the navigation bar.
 *   Falls back to `automatic` on tvOS and macOS.
 */
export type SearchFieldPlacement = 'automatic' | 'toolbar' | 'sidebar' | 'navigationBarDrawer';

/**
 * Marks a view as searchable and binds the query to an observable native state.
 *
 * Reading `state.value` returns the current query. Writing to it updates the search field.
 * Apply the modifier to a view inside a `NavigationStack` or `NavigationSplitView`, the same way
 * SwiftUI requires it. Filtering of the content stays in JavaScript.
 *
 * @param text - An `ObservableState<string>` created with `useNativeState`.
 * @param options.placement - Where the search field is placed. Maps to the `placement:` parameter
 *   of SwiftUI's `.searchable(text:placement:prompt:)`. Defaults to `automatic`.
 * @param options.prompt - Text that describes the search field, shown when it is empty.
 * @param options.onChange - Fires on the JS thread when the user edits or clears the search field.
 *   It does not fire for values written from JavaScript.
 *
 * @platform ios
 * @platform tvos
 * @platform macos
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/searchable(text:placement:prompt:)-18a8f).
 *
 * @example
 * ```tsx
 * const query = useNativeState('');
 *
 * <Host>
 *   <NavigationStack>
 *     <List
 *       modifiers={[
 *         searchable(query, {
 *           prompt: 'Search agents',
 *           onChange: (text) => setFilter(text),
 *         }),
 *       ]}>
 *       {rows.map((row) => (
 *         <Text key={row.id}>{row.name}</Text>
 *       ))}
 *     </List>
 *   </NavigationStack>
 * </Host>
 * ```
 */
export const searchable = (
  text: ObservableState<string>,
  options?: {
    placement?: SearchFieldPlacement;
    prompt?: string;
    onChange?: (text: string) => void;
  }
) => {
  const params = {
    text: getStateId(text),
    placement: options?.placement,
    prompt: options?.prompt,
  };
  const onChange = options?.onChange;
  if (onChange) {
    return createModifierWithEventListener(
      'searchable',
      (event: { text?: string }) => onChange(event?.text ?? ''),
      params
    );
  }
  return createModifier('searchable', params);
};

/**
 * Behavior of the search field that the `searchable` modifier places in the toolbar.
 *
 * - `automatic`: the system picks the behavior for the current context.
 * - `minimize`: the search field collapses to a button and expands when the user taps it.
 */
export type SearchToolbarBehavior = 'automatic' | 'minimize';

/**
 * Sets how the toolbar search field behaves.
 *
 * Use `minimize` to get the collapsed search button that expands over the toolbar.
 * Apply it next to `searchable` on the same view.
 *
 * On iOS below 26.0, the modifier is a no-op.
 *
 * @param behavior - The search field behavior.
 *
 * @platform ios 26.0+
 * @platform tvos 26.0+
 * @platform macos 26.0+
 *
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/searchtoolbarbehavior(_:)).
 *
 * @example
 * ```tsx
 * <List modifiers={[searchable(query), searchToolbarBehavior('minimize')]}>
 * ```
 */
export const searchToolbarBehavior = (behavior: SearchToolbarBehavior) =>
  createModifier('searchToolbarBehavior', { behavior });
