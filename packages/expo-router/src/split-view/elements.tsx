import React from 'react';
import { Text, View } from 'react-native';

import type {
  NativeButtonProps,
  SidebarContextValue,
  SidebarHeaderProps,
  SidebarHeaderSectionProps,
  SidebarHeaderTitleProps,
  SidebarTriggerProps,
} from './types';

export const ParentSideBarContext = React.createContext(0);

export const ChildrenSideBarContext = React.createContext<SidebarContextValue>({
  addChild: () => {},
  removeChild: () => {},
});

export function NativeButton({ children, style }: NativeButtonProps) {
  return <Text style={{ padding: 12, borderRadius: 8, fontSize: 32, ...style }}>{children}</Text>;
}

export function SidebarTrigger({ children }: SidebarTriggerProps) {
  return children ?? null;
}

export function SidebarHeaderComponent({ children }: SidebarHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', width: '100%', gap: 8, position: 'absolute' }}>
      {children}
    </View>
  );
}

export function SidebarHeaderTitle({ children }: SidebarHeaderTitleProps) {
  return <Text>{children}</Text>;
}

export function SidebarHeaderRight({ children }: SidebarHeaderSectionProps) {
  return <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>;
}

export function SidebarHeaderLeft({ children }: SidebarHeaderSectionProps) {
  return <View style={{ flex: 1, alignItems: 'flex-start' }}>{children}</View>;
}

export const SidebarHeader = Object.assign(SidebarHeaderComponent, {
  Title: SidebarHeaderTitle,
  Right: SidebarHeaderRight,
  Left: SidebarHeaderLeft,
});
