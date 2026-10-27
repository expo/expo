import type { SFSymbol } from 'sf-symbols-typescript';

export interface SplitViewNativeToolbarItem {
  title: string;
  icon?: SFSymbol;
}

// TODO(@ubax): Expose more header options, e.g. subtitle (ENG-28657)
export interface SplitViewNativeHeaderProps {
  title?: string;
  largeTitle?: boolean;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { side: 'left' | 'right'; index: number } }) => void;
}
