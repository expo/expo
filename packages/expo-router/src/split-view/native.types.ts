import type {
  SplitViewMenu,
  SplitViewMenuAction,
  SplitViewSearchBar,
  SplitViewToolbarItem,
} from './elements';

type SplitViewNativeMenuAction = Omit<SplitViewMenuAction, 'onPress'> & { id: string };

type SplitViewNativeToolbarItem = Omit<SplitViewToolbarItem, 'onPress' | 'menu'> & {
  id: string;
  menu?: Omit<SplitViewMenu, 'items'> & { items: SplitViewNativeMenuAction[] };
};

// TODO(@ubax): Expose more header options, e.g. subtitle (ENG-28657)
export interface SplitViewNativeHeaderProps {
  title?: string;
  subtitle?: string;
  largeTitle?: boolean;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { id: string } }) => void;
  searchBar?: Pick<SplitViewSearchBar, 'placeholder'>;
  onSearchBarChangeText?: SplitViewSearchBar['onChangeText'];
  onSearchBarSearchButtonPress?: SplitViewSearchBar['onSearchButtonPress'];
}
