import { requireNativeView } from 'expo';
import { Ref } from 'react';

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
};

type NativeSearchBarProps = SearchBarProps & {};

const SearchBarNativeView: React.ComponentType<NativeSearchBarProps> = requireNativeView(
  'ExpoUI',
  'SearchBarView'
);

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
export function SearchBar(props: SearchBarProps) {
  return <SearchBarNativeView {...transformSearchBarProps(props)} />;
}
