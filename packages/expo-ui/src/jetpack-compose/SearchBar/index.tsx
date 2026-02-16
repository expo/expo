import { requireNativeView } from 'expo';

import { type ExpoModifier, type ViewEvent } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

export type SearchBarProps = {
  /**
   * Callback function that is called when the search text is submitted.
   */
  onSearch?: (searchText: string) => void;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * The children of the component.
   */
  children?: React.ReactNode;
};

type PlaceholderProps = {
  /**
   * The children of the component.
   */
  children: React.ReactNode;
};

type ExpandedFullScreenSearchBarProps = {
  /**
   * The children of the component.
   */
  children: React.ReactNode;
};

type NativeSearchBarProps = Omit<SearchBarProps, 'onSearch'> &
  ViewEvent<'onSearch', { value: string }>;

type NativeSlotViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SearchBarNativeView: React.ComponentType<NativeSearchBarProps> = requireNativeView(
  'ExpoUI',
  'SearchBarView'
);

// Internal slot marker component - not exported
const SlotNativeView: React.ComponentType<NativeSlotViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

/**
 * Placeholder component for SearchBar.
 * This component marks its children to be rendered in the placeholder slot.
 */
export function SearchBarPlaceholder(props: PlaceholderProps) {
  return <SlotNativeView slotName="placeholder">{props.children}</SlotNativeView>;
}

/**
 * ExpandedFullScreenSearchBar component for SearchBar.
 * This component marks its children to be rendered in the expanded full-screen search bar.
 */
export function ExpandedFullScreenSearchBar(props: ExpandedFullScreenSearchBarProps) {
  return <SlotNativeView slotName="expandedFullScreenSearchBar">{props.children}</SlotNativeView>;
}

function transformSearchBarProps(props: SearchBarProps): NativeSearchBarProps {
  const { modifiers, onSearch, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
    onSearch: (event) => {
      onSearch?.(event.nativeEvent.value);
    },
  };
}

/**
 * Renders a `SearchBar` component.
 */
function SearchBar(props: SearchBarProps) {
  return (
    <SearchBarNativeView {...transformSearchBarProps(props)}>{props.children}</SearchBarNativeView>
  );
}

SearchBar.Placeholder = SearchBarPlaceholder;
SearchBar.ExpandedFullScreenSearchBar = ExpandedFullScreenSearchBar;

export { SearchBar };
