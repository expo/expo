import { type ReactElement } from 'react';
import { View } from 'react-native';

export function RouterSplitView({
  detail,
}: {
  sidebar: ReactElement;
  content: ReactElement;
  detail: ReactElement;
}) {
  return <View style={{ flex: 1 }}>{detail}</View>;
}
