import { requireNativeView } from 'expo';
import { Children } from 'react';

import { type ExpoModifier, type ViewEvent } from '../../types';

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
export function Placeholder(props: PlaceholderProps) {
  return <>{props.children}</>;
}
Placeholder.tag = 'Placeholder';

/**
 * ExpandedFullScreenSearchBar component for SearchBar.
 * This component marks its children to be rendered in the expanded full-screen search bar.
 */
export function ExpandedFullScreenSearchBar(props: ExpandedFullScreenSearchBarProps) {
  return <>{props.children}</>;
}
ExpandedFullScreenSearchBar.tag = 'ExpandedFullScreenSearchBar';

function transformSearchBarProps(props: SearchBarProps): NativeSearchBarProps {
  const { onSearch, ...restProps } = props;
  return {
    ...restProps,
    onSearch: (event) => {
      onSearch?.(event.nativeEvent.value);
    },
    // @ts-expect-error
    modifiers: restProps.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Renders a `SearchBar` component.
 */
function SearchBar(props: SearchBarProps) {
  // Separate slots from regular children
  let placeholderContent: React.ReactNode = null;
  let expandedFullScreenSearchBarContent: React.ReactNode = null;
  const regularChildren: React.ReactNode[] = [];

  Children.forEach(props.children as any, (child) => {
    if (child?.type?.tag === Placeholder.tag) {
      placeholderContent = child.props.children;
    } else if (child?.type?.tag === ExpandedFullScreenSearchBar.tag) {
      expandedFullScreenSearchBarContent = child.props.children;
    } else {
      regularChildren.push(child);
    }
  });

  return (
    <SearchBarNativeView {...transformSearchBarProps(props)}>
      {regularChildren}
      {placeholderContent && (
        <SlotNativeView slotName="placeholder">{placeholderContent}</SlotNativeView>
      )}
      {expandedFullScreenSearchBarContent && (
        <SlotNativeView slotName="expandedFullScreenSearchBar">
          {expandedFullScreenSearchBarContent}
        </SlotNativeView>
      )}
    </SearchBarNativeView>
  );
}

SearchBar.Placeholder = Placeholder;
SearchBar.ExpandedFullScreenSearchBar = ExpandedFullScreenSearchBar;

export { SearchBar };
