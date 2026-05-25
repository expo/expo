import { ListItem as ListItemBase } from './ListItem';
import type { ListItemLeadingProps, ListItemSupportingProps, ListItemTrailingProps } from './types';
declare const ListItem: typeof ListItemBase & {
    Leading: React.FC<ListItemLeadingProps>;
    Trailing: React.FC<ListItemTrailingProps>;
    Supporting: React.FC<ListItemSupportingProps>;
};
export { ListItem };
export * from './types';
//# sourceMappingURL=index.d.ts.map