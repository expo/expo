import { View } from 'react-native';

import type { SelectableTextProps } from './SelectableText';

export type {
  SelectableTextProps,
  SelectionMenuActionEvent,
  SelectionMenuItem,
} from './SelectableText';

export function SelectableText({ menu, onMenuAction, ...props }: SelectableTextProps) {
  return <View {...props} />;
}
