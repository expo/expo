import type { SFSymbol } from 'sf-symbols-typescript';

import type {
  SplitViewMenu,
  SplitViewMenuAction,
  SplitViewSearchBar,
  SplitViewToolbarItem,
} from './elements';

type SplitViewNativeMenuAction = Omit<SplitViewMenuAction, 'onPress'> & { id: string };

type SplitViewNativeToolbarItem = Omit<
  SplitViewToolbarItem,
  'onPress' | 'menu' | 'icon' | 'iconRenderingMode' | 'badge' | 'variant' | 'separateBackground'
> & {
  id: string;
  icon?: SFSymbol;
  xcassetName?: string;
  imageRenderingMode?: 'template' | 'original';
  badgeConfiguration?: { value?: string } & NonNullable<SplitViewToolbarItem['badge']>['style'];
  barButtonItemStyle?: 'plain' | 'prominent';
  sharesBackground?: boolean;
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
