import type {
  SplitViewMenu,
  SplitViewMenuAction,
  SplitViewSearchBar,
  SplitViewToolbarItem,
} from './elements';

type ToolbarItemId = `${'left' | 'right'}.${number}`;
type MenuActionId = `${ToolbarItemId}.${number}`;

type SplitViewNativeMenuAction = Omit<SplitViewMenuAction, 'onPress'> & { id: MenuActionId };

export type SplitViewNativeToolbarItem = Omit<SplitViewToolbarItem, 'onPress' | 'menu'> & {
  id: ToolbarItemId;
  menu?: Omit<SplitViewMenu, 'items'> & { items: SplitViewNativeMenuAction[] };
};

export interface SplitViewNativeHeaderProps {
  title?: string;
  subtitle?: string;
  largeTitle?: boolean;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { id: ToolbarItemId | MenuActionId } }) => void;
  searchBar?: Pick<SplitViewSearchBar, 'placeholder'>;
  onSearchBarChangeText?: SplitViewSearchBar['onChangeText'];
  onSearchBarSearchButtonPress?: SplitViewSearchBar['onSearchButtonPress'];
}
