import { getStateId, type ObservableState } from '../../State';
import { createModifier, createModifierWithEventListener } from './createModifier';

/**
 * The placement of a search field in a view hierarchy.
 *
 * - `automatic`: SwiftUI places the search field automatically.
 * - `toolbar`: The search field appears in the toolbar. Falls back to `automatic` on tvOS.
 * - `sidebar`: The search field appears in the sidebar of a navigation view. Falls back to
 *   `automatic` on tvOS.
 * - `navigationBarDrawer`: The search field appears in the navigation bar. Falls back to
 *   `automatic` on macOS and tvOS.
 */
export type SearchFieldPlacement = 'automatic' | 'toolbar' | 'sidebar' | 'navigationBarDrawer';

/**
 * Marks this view as searchable, which configures the display of a search field.
 *
 * @param text - The text to display and edit in the search field. An `ObservableState<string>`
 *   created with `useNativeState`.
 * @param options.placement - The preferred placement of the search field within the containing
 *   view hierarchy. Defaults to `automatic`.
 * @param options.prompt - The prompt of the search field, which provides users with guidance on
 *   what to search for.
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
 * The behavior of a search field in a toolbar.
 *
 * - `automatic`: The automatic behavior.
 * - `minimize`: A search toolbar behavior that prefers rendering a search field as a button-like
 *   control. Falls back to `automatic` on macOS and tvOS.
 */
export type SearchToolbarBehavior = 'automatic' | 'minimize';

/**
 * Configures the behavior for search in the toolbar.
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
