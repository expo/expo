import { requireNativeView } from 'expo';
import type { ViewProps } from 'react-native';

export type SelectionMenuItem = {
  /** Identifies the item in `onMenuAction`. */
  id: string;
  title: string;
};

export type SelectionMenuActionEvent = {
  /** The `id` of the menu item that the user pressed. */
  id: string;
  /** The selected text. */
  selectedText: string;
  /** The start of the selection, as a UTF-16 index into the text of the `Text`. */
  start: number;
  /** The end of the selection, as a UTF-16 index into the text of the `Text`. */
  end: number;
};

export type SelectableTextProps = ViewProps & {
  /** Items added to the selection menu, before the system items. */
  menu?: SelectionMenuItem[];
  onMenuAction?: (event: SelectionMenuActionEvent) => void;
};

type NativeSelectableTextProps = Omit<SelectableTextProps, 'onMenuAction'> & {
  onMenuAction?: (event: { nativeEvent: SelectionMenuActionEvent }) => void;
  collapsableChildren?: boolean;
};

const NativeSelectableText: React.ComponentType<NativeSelectableTextProps> =
  requireNativeView('ExpoSelectableText');

/**
 * Adds range selection and custom selection menu items to the React Native `Text`
 * elements inside it.
 */
export function SelectableText({ menu = [], onMenuAction, ...props }: SelectableTextProps) {
  return (
    <NativeSelectableText
      {...props}
      // On Android, a `Text` can't hold its inline views, so React Native mounts them into the
      // `Text`'s parent. That needs the `Text` to stay flattenable here.
      collapsableChildren={false}
      menu={menu}
      onMenuAction={onMenuAction ? ({ nativeEvent }) => onMenuAction(nativeEvent) : undefined}
    />
  );
}
