import { ListItem as ListItemBase } from './ListItem';
import { Leading, Supporting, Trailing } from './ListItemSlots';
import type { ListItemLeadingProps, ListItemSupportingProps, ListItemTrailingProps } from './types';

const ListItem = ListItemBase as typeof ListItemBase & {
  Leading: React.FC<ListItemLeadingProps>;
  Trailing: React.FC<ListItemTrailingProps>;
  Supporting: React.FC<ListItemSupportingProps>;
};
ListItem.Leading = Leading;
ListItem.Trailing = Trailing;
ListItem.Supporting = Supporting;

export { ListItem };
export * from './types';
