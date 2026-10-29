import type { SplitViewSearchBar } from './elements';

// TODO(@ubax): Expose more header options, e.g. subtitle (ENG-28657)
export interface SplitViewNativeHeaderProps {
  title?: string;
  largeTitle?: boolean;
  searchBar?: Pick<SplitViewSearchBar, 'placeholder'>;
  onSearchBarChangeText?: SplitViewSearchBar['onChangeText'];
  onSearchBarSearchButtonPress?: SplitViewSearchBar['onSearchButtonPress'];
}
