import { View } from 'react-native';

import { type RouterSplitViewProps } from './router-split-view.types';

export function RouterSplitView({ detail }: RouterSplitViewProps) {
  return <View style={{ flex: 1 }}>{detail.children}</View>;
}
