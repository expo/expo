import type { SplitViewHeader } from './elements';
import { SplitViewNativeHeader } from './native';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const { title, largeTitle, searchBar } = header;
  return (
    <SplitViewNativeHeader
      title={title}
      largeTitle={largeTitle}
      searchBar={searchBar && { placeholder: searchBar.placeholder }}
      onSearchBarChangeText={searchBar?.onChangeText}
      onSearchBarSearchButtonPress={searchBar?.onSearchButtonPress}
    />
  );
}
