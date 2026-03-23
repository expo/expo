import backIcon from './assets/back-icon.png';
import backIconMask from './assets/back-icon-mask.png';
import clearIcon from './assets/clear-icon.png';
import closeIcon from './assets/close-icon.png';
import searchIcon from './assets/search-icon.png';

export { Background } from './Background';
export { Badge } from './Badge';
export { Button } from './Button';
export { getDefaultSidebarWidth } from './getDefaultSidebarWidth';
export { getDefaultHeaderHeight } from './Header/getDefaultHeaderHeight';
export { getHeaderTitle } from './Header/getHeaderTitle';
export { Header } from './Header/Header';
export { HeaderBackButton } from './Header/HeaderBackButton';
export { HeaderBackContext } from './Header/HeaderBackContext';
export { HeaderBackground } from './Header/HeaderBackground';
export { HeaderButton } from './Header/HeaderButton';
export { HeaderHeightContext } from './Header/HeaderHeightContext';
export { HeaderShownContext } from './Header/HeaderShownContext';
export { HeaderTitle } from './Header/HeaderTitle';
export { useHeaderHeight } from './Header/useHeaderHeight';
export { getLabel } from './Label/getLabel';
export { Label } from './Label/Label';
export { Lazy } from './Lazy';
export { MissingIcon } from './MissingIcon';
export { PlatformPressable } from './PlatformPressable';
export { ResourceSavingView } from './ResourceSavingView';
export { SafeAreaProviderCompat } from './SafeAreaProviderCompat';
export { Screen } from './Screen';
export { Text } from './Text';
export { useFrameSize } from './useFrameSize';

export const Assets = [
  backIcon,
  backIconMask,
  searchIcon,
  closeIcon,
  clearIcon,
];

export * from './types';
