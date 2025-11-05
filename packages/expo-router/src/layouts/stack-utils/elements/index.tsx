import { StackHeaderBackButton } from './StackHeaderBackButton';
import { StackHeaderComponent } from './StackHeaderComponent';
import { StackHeaderLeft } from './StackHeaderLeft';
import { StackHeaderRight } from './StackHeaderRight';
import { StackHeaderSearchBar } from './StackHeaderSearchBar';
import { StackHeaderTitle } from './StackHeaderTitle';

export const StackHeader = Object.assign(StackHeaderComponent, {
  Left: StackHeaderLeft,
  Right: StackHeaderRight,
  BackButton: StackHeaderBackButton,
  Title: StackHeaderTitle,
  SearchBar: StackHeaderSearchBar,
});

export {
  StackHeaderBackButton,
  StackHeaderComponent,
  StackHeaderLeft,
  StackHeaderRight,
  StackHeaderSearchBar,
  StackHeaderTitle,
};
export { StackScreen, appendScreenStackPropsToOptions } from './StackScreen';
