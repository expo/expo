import { useEffect } from 'react';
import { View, ViewProps } from 'react-native';

interface HelpfulProps {
  onAppear?: () => void;
  onDisappear?: () => void;
}

export interface RNSNativeTabsScreenProps extends HelpfulProps {
  children: ViewProps['children'];
  isFocused?: boolean;
  badgeValue?: string;
}

export function RNSNativeTabsScreen(props: RNSNativeTabsScreenProps) {
  useEffect(() => {
    props.onAppear?.();
    return () => {
      props.onDisappear?.();
    };
  }, []);
  return <View style={{ flex: 1 }}>{props.children}</View>;
}
