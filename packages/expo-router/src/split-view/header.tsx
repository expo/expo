import type { SplitViewHeader, SplitViewToolbarItem } from './elements';
import { SplitViewNativeHeader } from './native';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const {
    title,
    subtitle,
    largeTitle,
    titleStyle,
    largeTitleStyle,
    leftToolbar,
    rightToolbar,
    searchBar,
    backButtonDisplayMode,
    backTitle,
    backVisible,
    hidden,
  } = header;
  return (
    <SplitViewNativeHeader
      title={title}
      subtitle={subtitle}
      largeTitle={largeTitle}
      titleColor={titleStyle?.color}
      largeTitleColor={largeTitleStyle?.color}
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
      backButtonDisplayMode={backButtonDisplayMode}
      backTitle={backTitle}
      backVisible={backVisible}
      hidden={hidden}
    />
  );
}

function toNativeToolbarItems(side: 'left' | 'right', items: SplitViewToolbarItem[] | undefined) {
  return items?.map(
    (
      {
        title,
        icon,
        menu,
        disabled,
        selected,
        tintColor,
        badge,
        variant,
        separateBackground,
        hidesSharedBackground,
        iconRenderingMode,
        accessibilityLabel,
        accessibilityHint,
      },
      index
    ) => {
      const xcassetName = typeof icon === 'object' ? icon.xcasset : undefined;
      return {
        id: `${side}.${index}`,
        title,
        icon: typeof icon === 'string' ? icon : undefined,
        xcassetName,
        imageRenderingMode: xcassetName
          ? (iconRenderingMode ?? (tintColor !== undefined ? 'template' : 'original'))
          : undefined,
        tintColor,
        badgeConfiguration: badge && { ...badge.style, value: badge.value?.toString() },
        barButtonItemStyle: variant === 'done' ? 'prominent' : variant,
        sharesBackground: separateBackground === undefined ? undefined : !separateBackground,
        hidesSharedBackground,
        accessibilityLabel,
        accessibilityHint,
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
      };
    }
  );
}
