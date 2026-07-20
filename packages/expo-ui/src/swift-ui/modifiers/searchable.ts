import { getStateId, type ObservableState } from '../../State';
import { createModifier, createModifierWithEventListener } from './createModifier';

export type SearchableNavigationBarDrawerDisplayMode = 'automatic' | 'always';

export type SearchablePlacement =
  | 'automatic'
  | 'toolbar'
  | 'toolbarPrincipal'
  | 'sidebar'
  | 'navigationBarDrawer'
  | {
      kind: 'navigationBarDrawer';
      displayMode?: SearchableNavigationBarDrawerDisplayMode;
    };

export type SearchableOptions = {
  /**
   * The preferred placement of the search field.
   *
   * Pass `'navigationBarDrawer'` for SwiftUI's default navigation bar drawer placement,
   * or `{ kind: 'navigationBarDrawer', displayMode: 'always' }` to expose the drawer
   * display mode parameter.
   *
   * @default 'automatic'
   */
  placement?: SearchablePlacement;
  /**
   * Text shown as the search field prompt.
   */
  prompt?: string;
  /**
   * Callback invoked on the JavaScript thread when the search text changes.
   */
  onChange?: (text: string) => void;
};

function normalizePlacement(placement?: SearchablePlacement) {
  if (!placement) {
    return undefined;
  }
  if (typeof placement === 'string') {
    return { kind: placement };
  }
  return placement;
}

/**
 * Marks a view as searchable with a native SwiftUI search field.
 *
 * @param text - An observable state that stores the search text.
 * @param options.placement - The preferred search field placement.
 * @param options.prompt - Text shown as the search field prompt.
 * @platform ios 16.4+
 * @see Official [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/view/searchable(text:placement:prompt:)).
 */
export const searchable = (text: ObservableState<string>, options?: SearchableOptions) => {
  const params = {
    text: getStateId(text),
    placement: normalizePlacement(options?.placement),
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

// exported for docs api data
export { type ObservableState };
