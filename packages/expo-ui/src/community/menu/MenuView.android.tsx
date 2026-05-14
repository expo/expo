import * as React from 'react';
import { Pressable, View } from 'react-native';

import type { MenuAction, MenuComponentProps, MenuComponentRef, NativeActionEvent } from './types';
import { HorizontalDivider } from '../../jetpack-compose/Divider';
import { DropdownMenu } from '../../jetpack-compose/DropdownMenu';
import {
  DropdownMenuItem,
  type DropdownMenuItemElementColors,
} from '../../jetpack-compose/DropdownMenu/DropdownMenuItem';
import { Host } from '../../jetpack-compose/Host';
import { Icon } from '../../jetpack-compose/Icon';
import { RNHostView } from '../../jetpack-compose/RNHostView';
import { Text as ComposeText } from '../../jetpack-compose/Text';
import { useMaterialColors } from '../../jetpack-compose/colors';

function actionId(action: MenuAction): string {
  return action.id ?? action.title;
}

function makeEvent(action: MenuAction): NativeActionEvent {
  return { nativeEvent: { event: actionId(action) } };
}

function buildElementColors(
  action: MenuAction,
  destructiveColor: string
): DropdownMenuItemElementColors | undefined {
  const isDestructive = action.attributes?.destructive === true;
  const textColor = action.titleColor ?? (isDestructive ? destructiveColor : undefined);
  // The leading icon picks up `leadingIconColor` via `LocalContentColor`, but only
  // when the `Icon` itself doesn't set `tint` — so an explicit `imageColor` from
  // the caller still wins.
  const leadingIconColor = isDestructive ? destructiveColor : undefined;
  if (textColor == null && leadingIconColor == null) {
    return undefined;
  }
  return {
    textColor,
    disabledTextColor: textColor,
    leadingIconColor,
    disabledLeadingIconColor: leadingIconColor,
  };
}

type ItemProps = {
  action: MenuAction;
  onPressAction: MenuComponentProps['onPressAction'];
  dismissAll: () => void;
  destructiveColor: string;
};

function MenuActionItem({ action, onPressAction, dismissAll, destructiveColor }: ItemProps) {
  const [submenuExpanded, setSubmenuExpanded] = React.useState(false);

  if (action.attributes?.hidden) {
    return null;
  }

  const { subactions, displayInline, state, attributes, title, image, imageColor } = action;
  // `image` is non-string only when caller passes an ImageSourcePropType
  // (number from `require()` or `{ uri }`). The string form is iOS-only (SF Symbol).
  const leadingIconSource = typeof image === 'string' || image == null ? null : image;
  const elementColors = buildElementColors(action, destructiveColor);

  if (subactions && subactions.length > 0) {
    if (displayInline) {
      return (
        <>
          <HorizontalDivider />
          {subactions.map((sub) => (
            <MenuActionItem
              key={actionId(sub)}
              action={sub}
              onPressAction={onPressAction}
              dismissAll={dismissAll}
              destructiveColor={destructiveColor}
            />
          ))}
          <HorizontalDivider />
        </>
      );
    }
    return (
      <DropdownMenu expanded={submenuExpanded} onDismissRequest={() => setSubmenuExpanded(false)}>
        <DropdownMenu.Trigger>
          <DropdownMenuItem
            enabled={!attributes?.disabled}
            elementColors={elementColors}
            onClick={() => setSubmenuExpanded(true)}>
            <DropdownMenuItem.Text>
              <ComposeText>{title}</ComposeText>
            </DropdownMenuItem.Text>
            {leadingIconSource && (
              <DropdownMenuItem.LeadingIcon>
                <Icon source={leadingIconSource} size={24} tint={imageColor} />
              </DropdownMenuItem.LeadingIcon>
            )}
          </DropdownMenuItem>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {subactions.map((sub) => (
            <MenuActionItem
              key={actionId(sub)}
              action={sub}
              onPressAction={onPressAction}
              dismissAll={() => {
                setSubmenuExpanded(false);
                dismissAll();
              }}
              destructiveColor={destructiveColor}
            />
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenuItem
      enabled={!attributes?.disabled}
      elementColors={elementColors}
      onClick={() => {
        onPressAction?.(makeEvent(action));
        dismissAll();
      }}>
      <DropdownMenuItem.Text>
        <ComposeText>{title}</ComposeText>
      </DropdownMenuItem.Text>
      {leadingIconSource && (
        <DropdownMenuItem.LeadingIcon>
          <Icon source={leadingIconSource} size={24} tint={imageColor} />
        </DropdownMenuItem.LeadingIcon>
      )}
      {state === 'on' && (
        <DropdownMenuItem.TrailingIcon>
          <ComposeText>✓</ComposeText>
        </DropdownMenuItem.TrailingIcon>
      )}
    </DropdownMenuItem>
  );
}

/**
 * A drop-in replacement for `@react-native-menu/menu` on Android.
 * Wraps the trigger in a `Pressable` (whose `onPress`/`onLongPress` opens the menu) and
 * renders the actions tree as a controlled Material `DropdownMenu`.
 *
 * Note: when `action.image` is a string, it is treated as an iOS SF Symbol and ignored
 * on Android — pass an `ImageSourcePropType` (e.g. `require('./icon.xml')`) to render
 * a leading icon. `MenuView.title` is also unused on Android since Material
 * `DropdownMenu` has no title slot.
 */
export function MenuView(props: MenuComponentProps & { ref?: React.Ref<MenuComponentRef> }) {
  const {
    ref,
    actions,
    onPressAction,
    onOpenMenu,
    onCloseMenu,
    shouldOpenOnLongPress,
    style,
    children,
    testID,
  } = props;
  const [expanded, setExpanded] = React.useState(false);
  // Mirror `expanded` into a ref and flip it eagerly inside the callbacks so a
  // second call within the same React tick is a no-op (the state update is
  // async and wouldn't otherwise reflect back to the ref in time).
  const expandedRef = React.useRef(false);

  const open = React.useCallback(() => {
    if (expandedRef.current) return;
    expandedRef.current = true;
    setExpanded(true);
    onOpenMenu?.();
  }, [onOpenMenu]);

  const dismissAll = React.useCallback(() => {
    if (!expandedRef.current) return;
    expandedRef.current = false;
    setExpanded(false);
    onCloseMenu?.();
  }, [onCloseMenu]);

  React.useImperativeHandle(ref, () => ({ show: open }), [open]);

  const destructiveColor = useMaterialColors().error;

  return (
    <View style={style} testID={testID}>
      <Host matchContents>
        <DropdownMenu expanded={expanded} onDismissRequest={dismissAll}>
          <DropdownMenu.Trigger>
            <RNHostView matchContents>
              <Pressable
                onPress={shouldOpenOnLongPress ? undefined : open}
                onLongPress={shouldOpenOnLongPress ? open : undefined}
                // Mirror upstream `@react-native-menu/menu`, which intercepts touches
                // natively on a bare `ReactViewGroup`: no click sound, no focus
                // highlight, no extra a11y node — children declare their own role.
                android_disableSound
                focusable={false}
                accessible={false}>
                {children}
              </Pressable>
            </RNHostView>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {actions.map((action) => (
              <MenuActionItem
                key={actionId(action)}
                action={action}
                onPressAction={onPressAction}
                dismissAll={dismissAll}
                destructiveColor={destructiveColor}
              />
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  );
}
