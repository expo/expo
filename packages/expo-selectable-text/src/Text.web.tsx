import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import type { SelectionMenuActionEvent } from './NativeSelectableText';

export type TextMenuProps = {
  children?: React.ReactNode;
};

export type TextMenuActionProps = {
  children: string;
  onPress: (event: SelectionMenuActionEvent) => void;
};

export type SelectableTextProps = TextProps & {
  ref?: React.Ref<React.ComponentRef<typeof RNText>>;
};

function TextMenu(_props: TextMenuProps): null {
  return null;
}

function TextMenuAction(_props: TextMenuActionProps): null {
  return null;
}

// The browser owns the selection menu, so `Text.Menu` renders nothing on web.
function Text(props: SelectableTextProps) {
  return <RNText {...props} />;
}

Text.displayName = 'Text';
Text.Menu = TextMenu;
Text.MenuAction = TextMenuAction;

export default Text;
