import type { SFSymbol } from 'sf-symbols-typescript';

export interface SplitViewNativeToolbarItem {
  title: string;
  icon?: SFSymbol;
}

export interface SplitViewNativeHeaderProps {
  title?: string;
  largeTitle?: boolean;
  leftToolbarItems?: SplitViewNativeToolbarItem[];
  rightToolbarItems?: SplitViewNativeToolbarItem[];
  onToolbarItemPress: (event: { nativeEvent: { side: 'left' | 'right'; index: number } }) => void;
}
