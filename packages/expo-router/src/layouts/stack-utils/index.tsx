import { StackHeaderBackButton, type StackHeaderBackButtonProps } from './StackHeaderBackButton';
import { StackHeaderComponent, type StackHeaderProps } from './StackHeaderComponent';
import { StackHeaderLeft, type StackHeaderLeftProps } from './StackHeaderLeft';
import { StackHeaderRight, type StackHeaderRightProps } from './StackHeaderRight';
import { StackHeaderSearchBar, type StackHeaderSearchBarProps } from './StackHeaderSearchBar';
import { StackHeaderTitle, type StackHeaderTitleProps } from './StackHeaderTitle';

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  SearchBar: StackHeaderSearchBar,
});

export {
  StackHeaderBackButton,
  type StackHeaderBackButtonProps,
  StackHeaderComponent,
  type StackHeaderProps,
  StackHeaderLeft,
  type StackHeaderLeftProps,
  StackHeaderRight,
  type StackHeaderRightProps,
  StackHeaderSearchBar,
  type StackHeaderSearchBarProps,
  StackHeaderTitle,
  type StackHeaderTitleProps,
};
export { StackScreen, appendScreenStackPropsToOptions, type StackScreenProps } from './StackScreen';
export { isChildOfType } from './utils';
