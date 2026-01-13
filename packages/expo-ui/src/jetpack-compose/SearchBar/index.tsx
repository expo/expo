import { requireNativeView } from 'expo';
import { Children, Ref } from 'react';

import { ExpoModifier } from '../../types';

export type SearchBarRef = {
  setText: (newText: string) => Promise<void>;
};

export type SearchBarProps = {
  /**
   * Can be used for imperatively setting text on the SearchBar component.
   */
  ref?: Ref<SearchBarRef>;
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

type NativeSearchBarProps = SearchBarProps & {};

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

function transformSearchBarProps(props: SearchBarProps): NativeSearchBarProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Renders a `SearchBar` component.
 */
function SearchBar(props: SearchBarProps) {
  // Separate Placeholder from regular children
  let placeholderContent: React.ReactNode = null;
  const regularChildren: React.ReactNode[] = [];

  Children.forEach(props.children as any, (child) => {
    if (child?.type?.tag === Placeholder.tag) {
      placeholderContent = child.props.children;
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
    </SearchBarNativeView>
  );
}

SearchBar.Placeholder = Placeholder;

export { SearchBar };
