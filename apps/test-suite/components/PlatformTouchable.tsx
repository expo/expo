import { TouchableHighlight, type TouchableHighlightProps } from 'react-native';

import { useTheme } from '../../common/ThemeProvider';

export default function PlatformTouchable(props: TouchableHighlightProps) {
  const { theme } = useTheme();
  return <TouchableHighlight underlayColor={theme.background.hover} {...props} />;
}
