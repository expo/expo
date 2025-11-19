import { StackHeaderBackButton, type StackHeaderBackButtonProps } from './StackHeaderBackButton';
import { StackHeaderButton, type StackHeaderButtonProps } from './StackHeaderButton';
import { StackHeaderComponent, type StackHeaderProps } from './StackHeaderComponent';
import { StackHeaderItem, type StackHeaderItemProps } from './StackHeaderItem';
import { StackHeaderLeft, type StackHeaderLeftProps, StackHeaderRight, type StackHeaderRightProps } from './StackHeaderLeftRight';
import { StackHeaderMenu, StackHeaderMenuAction, type StackHeaderMenuActionProps, type StackHeaderMenuProps } from './StackHeaderMenu';
import { StackHeaderSearchBar, type StackHeaderSearchBarProps } from './StackHeaderSearchBar';
import { StackHeaderTitle, type StackHeaderTitleProps } from './StackHeaderTitle';
import { StackHeaderBadge, StackHeaderIcon, StackHeaderLabel, type StackHeaderBadgeProps, type StackHeaderIconProps, type StackHeaderLabelProps } from './common-primitives';
export declare const StackHeader: typeof StackHeaderComponent & {
    Left: typeof StackHeaderLeft;
    Right: typeof StackHeaderRight;
    BackButton: typeof StackHeaderBackButton;
    Title: typeof StackHeaderTitle;
    SearchBar: typeof StackHeaderSearchBar;
    Button: typeof StackHeaderButton;
    Badge: import("react").FC<StackHeaderBadgeProps>;
    Label: import("react").FC<StackHeaderLabelProps>;
    Icon: import("react").FC<StackHeaderIconProps>;
    Menu: import("react").FC<StackHeaderMenuProps>;
    MenuAction: import("react").FC<StackHeaderMenuActionProps>;
    Item: typeof StackHeaderItem;
};
export { StackHeaderBackButton, type StackHeaderBackButtonProps, StackHeaderComponent, type StackHeaderProps, StackHeaderLeft, type StackHeaderLeftProps, StackHeaderRight, type StackHeaderRightProps, StackHeaderSearchBar, type StackHeaderSearchBarProps, StackHeaderTitle, type StackHeaderTitleProps, StackHeaderButton, type StackHeaderButtonProps, StackHeaderBadge, type StackHeaderBadgeProps, StackHeaderLabel, type StackHeaderLabelProps, StackHeaderIcon, type StackHeaderIconProps, StackHeaderMenu, type StackHeaderMenuProps, StackHeaderMenuAction, type StackHeaderMenuActionProps, StackHeaderItem, type StackHeaderItemProps, };
export { StackScreen, appendScreenStackPropsToOptions, type StackScreenProps } from './StackScreen';
export { isChildOfType } from './utils';
//# sourceMappingURL=index.d.ts.map