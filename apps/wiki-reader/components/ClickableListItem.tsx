import { ListItem } from '@expo/ui/jetpack-compose';
import { clickable, clip, Shapes } from '@expo/ui/jetpack-compose/modifiers';

interface Props {
  headline: string;
  supportingText?: string;
  itemPosition?: 'leading' | 'trailing';
  onClick: () => void;
  children?: React.ComponentProps<typeof ListItem>['children'];
}

export function ClickableListItem({
  headline,
  supportingText,
  itemPosition,
  onClick,
  children,
}: Props) {
  return (
    <ListItem
      headline={headline}
      supportingText={supportingText}
      modifiers={[clip(Shapes.RoundedCorner(cornerRadii(itemPosition))), clickable(onClick)]}>
      {children}
    </ListItem>
  );
}

export function cornerRadii(itemPosition: 'leading' | 'trailing' | undefined) {
  switch (itemPosition) {
    case 'leading':
      return { topStart: 20, topEnd: 20, bottomStart: 4, bottomEnd: 4 };
    case 'trailing':
      return { topStart: 4, topEnd: 4, bottomStart: 20, bottomEnd: 20 };
    default:
      return { topStart: 4, topEnd: 4, bottomStart: 4, bottomEnd: 4 };
  }
}

ClickableListItem.Leading = ListItem.Leading;
ClickableListItem.Trailing = ListItem.Trailing;
