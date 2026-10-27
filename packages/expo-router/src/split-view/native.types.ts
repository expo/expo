import type { SplitViewToolbarItem } from './elements';

type SplitViewNativeToolbarItem = Omit<SplitViewToolbarItem, 'onPress'>;

// TODO(@ubax): Expose more header options, e.g. subtitle (ENG-28657)
export interface SplitViewNativeHeaderProps {
  title?: string;
  largeTitle?: boolean;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { side: 'left' | 'right'; index: number } }) => void;
}
