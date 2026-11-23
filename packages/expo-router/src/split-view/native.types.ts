import type { ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import type {
  SplitViewHeader,
  SplitViewMenu,
  SplitViewMenuAction,
  SplitViewSearchBar,
  SplitViewToolbarItem,
} from './elements';

type ToolbarItemId = `${'left' | 'right'}.${number}`;
type MenuActionId = `${ToolbarItemId}.${number}`;

type SplitViewNativeMenuAction = Omit<SplitViewMenuAction, 'onPress'> & { id: MenuActionId };

export type SplitViewNativeToolbarItem = Omit<
  SplitViewToolbarItem,
  'onPress' | 'menu' | 'icon' | 'iconRenderingMode' | 'badge' | 'variant' | 'separateBackground'
> & {
  id: ToolbarItemId;
  icon?: SFSymbol;
  xcassetName?: string;
  imageRenderingMode?: 'template' | 'original';
  badgeConfiguration?: { value?: string } & NonNullable<SplitViewToolbarItem['badge']>['style'];
  barButtonItemStyle?: 'plain' | 'prominent';
  sharesBackground?: boolean;
  menu?: Omit<SplitViewMenu, 'items'> & { items: SplitViewNativeMenuAction[] };
};

export interface SplitViewNativeHeaderProps {
  title?: string;
  subtitle?: string;
  largeTitle?: boolean;
  titleColor?: ColorValue;
  largeTitleColor?: ColorValue;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { id: ToolbarItemId | MenuActionId } }) => void;
  searchBar?: Pick<SplitViewSearchBar, 'placeholder'>;
  onSearchBarChangeText?: SplitViewSearchBar['onChangeText'];
  onSearchBarSearchButtonPress?: SplitViewSearchBar['onSearchButtonPress'];
  backTitle?: SplitViewHeader['backTitle'];
  backVisible?: SplitViewHeader['backVisible'];
}
