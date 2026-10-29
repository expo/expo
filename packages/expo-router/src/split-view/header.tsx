import type { SplitViewHeader, SplitViewToolbarItem } from './elements';
import { SplitViewNativeHeader } from './native';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const { title, largeTitle, leftToolbar, rightToolbar, searchBar } = header;
  return (
    <SplitViewNativeHeader
      title={title}
      largeTitle={largeTitle}
      leftToolbarItems={toNativeToolbarItems('left', leftToolbar)}
      rightToolbarItems={toNativeToolbarItems('right', rightToolbar)}
      onToolbarItemPress={({ nativeEvent: { id } }) => {
        // `id` is `<side>.<itemIndex>` or `<side>.<itemIndex>.<actionIndex>`.
        const [side, itemIndex, actionIndex] = id.split('.');
        const item = (side === 'left' ? leftToolbar : rightToolbar)?.[Number(itemIndex)];
        if (actionIndex === undefined) {
          item?.onPress?.();
        } else {
          item?.menu?.items[Number(actionIndex)]?.onPress?.();
        }
      }}
      searchBar={searchBar && { placeholder: searchBar.placeholder }}
      onSearchBarChangeText={searchBar?.onChangeText}
      onSearchBarSearchButtonPress={searchBar?.onSearchButtonPress}
    />
  );
}

function toNativeToolbarItems(side: 'left' | 'right', items: SplitViewToolbarItem[] | undefined) {
  return items?.map(({ title, icon, menu, disabled, selected }, index) => ({
    id: `${side}.${index}`,
    title,
    icon,
    disabled,
    selected,
    menu: menu && {
      title: menu.title,
      items: menu.items.map(({ title, icon, destructive, disabled, isOn }, actionIndex) => ({
        id: `${side}.${index}.${actionIndex}`,
        title,
        icon,
        destructive,
        disabled,
        isOn,
      })),
    },
  }));
}
