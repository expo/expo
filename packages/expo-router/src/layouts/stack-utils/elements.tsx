import type {
  StackHeaderBackButtonProps,
  StackHeaderLeftProps,
  StackHeaderProps,
  StackHeaderRightProps,
  StackHeaderTitleProps,
  StackHeaderSearchBarProps,
  StackScreenProps,
} from './types';
import { Screen } from '../../views/Screen';

export function StackHeaderComponent(props: StackHeaderProps) {
  return null;
}

export function StackHeaderLeft(props: StackHeaderLeftProps) {
  return null;
}

export function StackHeaderRight(props: StackHeaderRightProps) {
  return null;
}

export function StackHeaderBackButton(props: StackHeaderBackButtonProps) {
  return null;
}

export function StackHeaderTitle(props: StackHeaderTitleProps) {
  return null;
}

export function StackHeaderSearchBar(props: StackHeaderSearchBarProps) {
  return null;
}

export function StackScreen({ children, ...rest }: StackScreenProps) {
  return <Screen {...rest} />;
}

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  SearchBar: StackHeaderSearchBar,
});
