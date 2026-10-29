import type { SplitViewHeader, SplitViewToolbarItem } from './elements';
import { SplitViewNativeHeader } from './native';
import type { SplitViewNativeToolbarItem } from './native.types';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const { title, subtitle, largeTitle, leftToolbar, rightToolbar, searchBar } = header;
  return (
    <SplitViewNativeHeader
      title={title}
      subtitle={subtitle}
      largeTitle={largeTitle}
      leftToolbarItems={toNativeToolbarItems('left', leftToolbar)}
      rightToolbarItems={toNativeToolbarItems('right', rightToolbar)}
      onToolbarItemPress={({ nativeEvent: { id } }) => {
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

function toNativeToolbarItems(
  side: 'left' | 'right',
  items: SplitViewToolbarItem[] | undefined
): SplitViewNativeToolbarItem[] | undefined {
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
