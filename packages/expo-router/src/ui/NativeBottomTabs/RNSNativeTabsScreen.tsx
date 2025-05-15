import { View, ViewProps } from 'react-native';

export interface RNSNativeTabsScreenProps {
  children: ViewProps['children'];
  isFocused?: boolean;
  badgeValue?: string;
}

export function RNSNativeTabsScreen(props: RNSNativeTabsScreenProps) {
  return <View style={{ flex: 1 }}>{props.children}</View>;
}
