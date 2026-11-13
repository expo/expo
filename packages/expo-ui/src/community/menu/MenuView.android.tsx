import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Box } from '../../jetpack-compose/Box';
import {
  DropdownMenuGroup,
  DropdownMenuPopup,
  SelectableDropdownMenuItem,
  type MenuShapePosition,
  type SelectableDropdownMenuItemColors,
} from '../../jetpack-compose/DropdownMenu';
import {
  DropdownMenuItem,
  type DropdownMenuItemElementColors,
} from '../../jetpack-compose/DropdownMenu/DropdownMenuItem';
import { Host } from '../../jetpack-compose/Host';
import { Icon } from '../../jetpack-compose/Icon';
import { RNHostView } from '../../jetpack-compose/RNHostView';
import { Spacer } from '../../jetpack-compose/Spacer';
import { Text as ComposeText } from '../../jetpack-compose/Text';
import { useMaterialColors } from '../../jetpack-compose/colors';
import { height, verticalScroll } from '../../jetpack-compose/modifiers';
import type { PopupProperties } from '../../types';
import type { MenuAction, MenuComponentProps, MenuComponentRef, NativeActionEvent } from './types';

// Clipped popups drop the status bar offset, so edge-to-edge menus near the bottom detach from the anchor.
const POPUP_PROPERTIES: PopupProperties = { clippingEnabled: false };

const CHECK_ICON = require('../../../assets/check.xml');

// Compose's `MenuDefaults.GroupSpacing`.
const MENU_GROUP_SPACING = 2;
// Compose's `MenuDefaults.LeadingIconSize`.
const MENU_ITEM_ICON_SIZE = 20;

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

function buildSelectableColors(
  action: MenuAction,
  destructiveColor: string
): SelectableDropdownMenuItemColors | undefined {
  const colors = buildElementColors(action, destructiveColor);
  if (colors == null) {
    return undefined;
  }
  // A selected item keeps the destructive or custom colors instead of the selected-state colors.
  return {
    ...colors,
    selectedTextColor: colors.textColor,
    selectedLeadingIconColor: colors.leadingIconColor,
  };
}

/**
 * Splits actions into the groups of a Material 3 Expressive menu. A `displayInline` action
 * becomes a group of its own. Other actions that follow each other share a group.
 */
function groupActions(actions: MenuAction[]): MenuAction[][] {
  const groups: MenuAction[][] = [];
  let run: MenuAction[] = [];
  const endRun = () => {
    if (run.length > 0) {
      groups.push(run);
      run = [];
    }
  };
  for (const action of actions) {
    if (action.attributes?.hidden) {
      continue;
    }
    if (action.displayInline && action.subactions && action.subactions.length > 0) {
      endRun();
      groups.push(...groupActions(action.subactions));
    } else {
      run.push(action);
    }
  }
  endRun();
  return groups;
}

type MenuHandlers = {
  onPressAction: MenuComponentProps['onPressAction'];
  dismissAll: () => void;
  destructiveColor: string;
};

function MenuGroups({ actions, ...handlers }: MenuHandlers & { actions: MenuAction[] }) {
  const groups = groupActions(actions);
  return groups.map((group, groupIndex) => (
    <React.Fragment key={actionId(group[0])}>
      {groupIndex > 0 && <Spacer modifiers={[height(MENU_GROUP_SPACING)]} />}
      <DropdownMenuGroup shapes={{ index: groupIndex, count: groups.length }}>
        {group.map((action, index) => (
          <MenuActionItem
            key={actionId(action)}
            action={action}
            shape={{ index, count: group.length }}
            {...handlers}
          />
        ))}
      </DropdownMenuGroup>
    </React.Fragment>
  ));
}

function MenuActionItem({
  action,
  shape,
  onPressAction,
  dismissAll,
  destructiveColor,
}: MenuHandlers & { action: MenuAction; shape: MenuShapePosition }) {
  const [submenuExpanded, setSubmenuExpanded] = React.useState(false);
  const materialColors = useMaterialColors();

  const { subactions, state, attributes, title, image, imageColor } = action;
  // `image` is non-string only when caller passes an ImageSourcePropType
  // (number from `require()` or `{ uri }`). The string form is iOS-only (SF Symbol).
  const leadingIconSource = typeof image === 'string' || image == null ? null : image;
  const elementColors = buildElementColors(action, destructiveColor);
  const leadingIcon = leadingIconSource && (
    <Icon source={leadingIconSource} size={MENU_ITEM_ICON_SIZE} tint={imageColor} />
  );

  if (subactions && subactions.length > 0) {
    return (
      <Box>
        <DropdownMenuItem
          enabled={!attributes?.disabled}
          shape={shape}
          elementColors={elementColors}
          onClick={() => setSubmenuExpanded(true)}>
          <DropdownMenuItem.Text>
            <ComposeText>{title}</ComposeText>
          </DropdownMenuItem.Text>
          {leadingIcon && (
            <DropdownMenuItem.LeadingIcon>{leadingIcon}</DropdownMenuItem.LeadingIcon>
          )}
        </DropdownMenuItem>
        <DropdownMenuPopup
          expanded={submenuExpanded}
          onDismissRequest={() => setSubmenuExpanded(false)}
          anchorPosition="end"
          properties={POPUP_PROPERTIES}
          // Unlike `DropdownMenu`, `DropdownMenuPopup` does not scroll a menu taller than the window.
          modifiers={[verticalScroll()]}>
          <MenuGroups
            actions={subactions}
            onPressAction={onPressAction}
            dismissAll={() => {
              setSubmenuExpanded(false);
              dismissAll();
            }}
            destructiveColor={destructiveColor}
          />
        </DropdownMenuPopup>
      </Box>
    );
  }

  const onClick = () => {
    onPressAction?.(makeEvent(action));
    dismissAll();
  };

  // An action with a `state` is a choice. Compose gives a selected choice a highlighted container
  // and `SelectedLeadingIcon`, which replaces the leading icon while the item is selected, and
  // exposes the selected state to screen readers.
  if (state != null) {
    const colors = buildSelectableColors(action, destructiveColor);
    return (
      <SelectableDropdownMenuItem
        selected={state === 'on'}
        enabled={!attributes?.disabled}
        shapes={shape}
        colors={colors}
        onClick={onClick}>
        <SelectableDropdownMenuItem.Text>
          <ComposeText>{title}</ComposeText>
        </SelectableDropdownMenuItem.Text>
        {leadingIcon && (
          <SelectableDropdownMenuItem.LeadingIcon>
            {leadingIcon}
          </SelectableDropdownMenuItem.LeadingIcon>
        )}
        <SelectableDropdownMenuItem.SelectedLeadingIcon>
          {/* An untinted icon in this slot is not drawn, so tint it like the selected container text. */}
          <Icon
            source={CHECK_ICON}
            size={MENU_ITEM_ICON_SIZE}
            tint={colors?.selectedLeadingIconColor ?? materialColors.onTertiaryContainer}
          />
        </SelectableDropdownMenuItem.SelectedLeadingIcon>
      </SelectableDropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      enabled={!attributes?.disabled}
      shape={shape}
      elementColors={elementColors}
      onClick={onClick}>
      <DropdownMenuItem.Text>
        <ComposeText>{title}</ComposeText>
      </DropdownMenuItem.Text>
      {leadingIcon && <DropdownMenuItem.LeadingIcon>{leadingIcon}</DropdownMenuItem.LeadingIcon>}
    </DropdownMenuItem>
  );
}

/**
 * A drop-in replacement for `@react-native-menu/menu` on Android.
 * Wraps the trigger in a `Pressable` (whose `onPress`/`onLongPress` opens the menu) and
 * renders the actions tree as a controlled Material 3 Expressive `DropdownMenuPopup`.
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
    colorScheme,
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
      <Host colorScheme={colorScheme} matchContents>
        <Box>
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
          <DropdownMenuPopup
            expanded={expanded}
            onDismissRequest={dismissAll}
            properties={POPUP_PROPERTIES}
            // Unlike `DropdownMenu`, `DropdownMenuPopup` does not scroll a menu taller than the window.
            modifiers={[verticalScroll()]}>
            <MenuGroups
              actions={actions}
              onPressAction={onPressAction}
              dismissAll={dismissAll}
              destructiveColor={destructiveColor}
            />
          </DropdownMenuPopup>
        </Box>
      </Host>
    </View>
  );
}
