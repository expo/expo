import { StackHeaderBackButton, type StackHeaderBackButtonProps } from './StackHeaderBackButton';
import { StackHeaderButton, type StackHeaderButtonProps } from './StackHeaderButton';
import { StackHeaderComponent, type StackHeaderProps } from './StackHeaderComponent';
import {
  StackHeaderLeft,
  type StackHeaderLeftProps,
  StackHeaderRight,
  type StackHeaderRightProps,
} from './StackHeaderLeftRight';
import {
  StackHeaderMenu,
  StackHeaderMenuAction,
  type StackHeaderMenuActionProps,
  type StackHeaderMenuProps,
} from './StackHeaderMenu';
import { StackHeaderSpacer, type StackHeaderSpacerProps } from './StackHeaderSpacer';
import { StackHeaderTitle, type StackHeaderTitleProps } from './StackHeaderTitle';
import { StackHeaderView, type StackHeaderViewProps } from './StackHeaderView';
import { StackSearchBar, type StackSearchBarProps } from './StackSearchBar';
import {
  StackHeaderBadge,
  StackHeaderIcon,
  StackHeaderLabel,
  type StackHeaderBadgeProps,
  type StackHeaderIconProps,
  type StackHeaderLabelProps,
} from './common-primitives';
import type { StackHeaderItemSharedProps } from './shared';

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  Button: StackHeaderButton,
  Badge: StackHeaderBadge,
  Label: StackHeaderLabel,
  Icon: StackHeaderIcon,
  Menu: StackHeaderMenu,
  MenuAction: StackHeaderMenuAction,
  View: StackHeaderView,
  Spacer: StackHeaderSpacer,
});

export {
  StackHeaderBackButton,
  type StackHeaderBackButtonProps,
  type StackHeaderProps,
  StackHeaderLeft,
  type StackHeaderLeftProps,
  StackHeaderRight,
  type StackHeaderRightProps,
  StackSearchBar,
  type StackSearchBarProps,
  StackHeaderTitle,
  type StackHeaderTitleProps,
  StackHeaderButton,
  type StackHeaderButtonProps,
  StackHeaderBadge,
  type StackHeaderBadgeProps,
  StackHeaderLabel,
  type StackHeaderLabelProps,
  StackHeaderIcon,
  type StackHeaderIconProps,
  StackHeaderMenu,
  type StackHeaderMenuProps,
  StackHeaderMenuAction,
  type StackHeaderMenuActionProps,
  StackHeaderView,
  type StackHeaderViewProps,
  StackHeaderSpacer,
  type StackHeaderSpacerProps,
  type StackHeaderItemSharedProps,
};

export { StackScreen, appendScreenStackPropsToOptions, type StackScreenProps } from './StackScreen';
