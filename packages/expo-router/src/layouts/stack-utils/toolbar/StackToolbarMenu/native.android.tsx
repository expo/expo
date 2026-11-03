'use client';
import type { MenuShapePosition } from '@expo/ui/jetpack-compose';
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  use,
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { ColorValue } from 'react-native';

import { requireExpoUI } from '../../../../optional-libraries/expo-ui';
import { Label } from '../../../../primitives';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { getFirstChildOfType, isChildOfType } from '../../../../utils/children';
import { getBadgeContentDescription, ToolbarItemBadge } from '../ToolbarItemBadge';
import { useToolbarColors } from '../context';
import {
  DEFAULT_DESTRUCTIVE_COLOR,
  DEFAULT_TOOLBAR_BACKGROUND_COLOR,
  DEFAULT_TOOLBAR_TINT_COLOR,
} from '../defaults';
import { getIconButtonContainerColors } from '../getIconButtonContainerColors';
import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from '../toolbar-primitives';
import type { NativeToolbarMenuActionProps, NativeToolbarMenuProps } from './types';

const arrowRightIcon = require('../../../../../assets/arrow_right.xml');
const checkmarkIcon = require('../../../../../assets/checkmark.xml');

const EXPO_UI_REQUIRED_MESSAGE =
  "Stack.Toolbar on Android requires '@expo/ui'. Install it with `npx expo install @expo/ui` and rebuild your app.";

// Compose's `MenuDefaults.GroupSpacing`.
const MENU_GROUP_SPACING = 2;
// Compose's `MenuDefaults.LeadingIconSize` and `MenuDefaults.TrailingIconSize`.
const MENU_ITEM_ICON_SIZE = 20;

/**
 * Context for propagating menu close callbacks from root to nested menus.
 * - `null` means root level (no parent menu)
 * - A function means nested level (call to close entire menu chain)
 */
const ToolbarMenuCloseContext = createContext<(() => void) | null>(null);

/**
 * The position of a menu item in its `DropdownMenuGroup`. Compose uses it to round the corners of
 * the first and the last item.
 */
const MenuItemShapeContext = createContext<MenuShapePosition | undefined>(undefined);

type MenuEntryProps = { hidden?: boolean; inline?: boolean; children?: ReactNode };
type MenuEntry = ReactElement<MenuEntryProps>;

/**
 * Returns the actions and submenus that a menu shows. Labels, icons, and badges configure the menu
 * itself, so they are not entries.
 */
function getVisibleMenuEntries(children: ReactNode): MenuEntry[] {
  return Children.toArray(children).filter(
    (child): child is MenuEntry =>
      isValidElement<MenuEntryProps>(child) &&
      !isChildOfType(child, StackToolbarLabel) &&
      !isChildOfType(child, StackToolbarIcon) &&
      !isChildOfType(child, StackToolbarBadge) &&
      !child.props.hidden &&
      !(child.props.inline && getVisibleMenuEntries(child.props.children).length === 0)
  );
}

/**
 * Splits the entries of a menu into Material 3 Expressive groups. An inline submenu is a section
 * on iOS, so it gets its own group. Other entries next to each other share a group.
 */
function groupMenuEntries(children: ReactNode): MenuEntry[][] {
  const groups: MenuEntry[][] = [];
  let items: MenuEntry[] = [];
  for (const entry of getVisibleMenuEntries(children)) {
    if (entry.props.inline) {
      if (items.length > 0) {
        groups.push(items);
        items = [];
      }
      groups.push([entry]);
    } else {
      items.push(entry);
    }
  }
  if (items.length > 0) {
    groups.push(items);
  }
  return groups;
}

function MenuItems({ entries }: { entries: MenuEntry[] }) {
  return entries.map((entry, index) => (
    <MenuItemShapeContext key={entry.key} value={{ index, count: entries.length }}>
      {entry}
    </MenuItemShapeContext>
  ));
}

function MenuGroups({
  children,
  containerColor,
}: {
  children: ReactNode;
  containerColor: ColorValue | undefined;
}) {
  const {
    expoUI: { DropdownMenuGroup, Spacer },
    modifiers: { height },
  } = requireExpoUI(EXPO_UI_REQUIRED_MESSAGE);
  const groups = groupMenuEntries(children);

  return groups.map((group, index) => {
    const isSection = group.length === 1 && group[0]!.props.inline;
    return (
      <Fragment key={group[0]!.key}>
        {index > 0 && <Spacer modifiers={[height(MENU_GROUP_SPACING)]} />}
        <DropdownMenuGroup shapes={{ index, count: groups.length }} containerColor={containerColor}>
          {/* An inline submenu renders its own items, see `NativeToolbarMenu`. */}
          {isSection ? group[0] : <MenuItems entries={group} />}
        </DropdownMenuGroup>
      </Fragment>
    );
  });
}

/**
 * Native toolbar menu component for Android.
 * Renders a Material 3 Expressive `DropdownMenuPopup` with an `IconButton` trigger (root), or a
 * `DropdownMenuItem` that opens a submenu next to it (nested).
 */
export const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = (props) => {
  const {
    expoUI: { Box, DropdownMenuItem, DropdownMenuPopup, Icon, IconButton, Text: ComposeText },
    modifiers: { background, verticalScroll },
  } = requireExpoUI(EXPO_UI_REQUIRED_MESSAGE);
  const [expanded, setExpanded] = useState(false);
  const parentClose = use(ToolbarMenuCloseContext);
  const itemShape = use(MenuItemShapeContext);
  const isNested = parentClose !== null;
  const toolbarColors = useToolbarColors();

  const tintColor = props.tintColor ?? toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR();
  // `tint={null}` tells `<Icon>` to draw the source in its original colors.
  // `undefined` would fall back to `LocalContentColor` (i.e. still a tint).
  // Only the user-provided source respects `imageRenderingMode`; internal
  // ornaments (submenu arrow, action checkmark) are always tinted.
  const sourceTint = props.imageRenderingMode === 'original' ? null : tintColor;

  const closeMenu = useCallback(() => {
    setExpanded(false);
    parentClose?.();
  }, [parentClose, setExpanded]);

  if (process.env.NODE_ENV !== 'production' && isNested && props.badge) {
    console.warn(
      'Stack.Toolbar.Badge on a nested Stack.Toolbar.Menu is not supported on Android; it is only rendered on a root menu. The badge will be ignored.'
    );
  }

  if (process.env.NODE_ENV !== 'production' && props.cornerRadius !== undefined) {
    console.warn(
      'Stack.Toolbar.Menu `cornerRadius` has no effect on Android. The Material 3 Expressive menu sets the corner shape of each group. Remove the `cornerRadius` prop.'
    );
  }

  // Inline nested: the parent menu puts this section in its own group.
  if (isNested && props.inline) {
    return <MenuItems entries={getVisibleMenuEntries(props.children)} />;
  }

  const menuContent = (
    <ToolbarMenuCloseContext value={closeMenu}>
      <MenuGroups containerColor={toolbarColors.backgroundColor}>{props.children}</MenuGroups>
    </ToolbarMenuCloseContext>
  );

  // Non-inline nested: a DropdownMenuItem that opens a submenu at its end
  if (isNested) {
    return (
      <Box>
        <DropdownMenuItem
          onClick={() => {
            if (!props.disabled) setExpanded(true);
          }}
          enabled={!props.disabled}
          shape={itemShape ?? { index: 0, count: 1 }}
          elementColors={{
            textColor: tintColor,
            leadingIconColor: tintColor,
            trailingIconColor: tintColor,
          }}>
          {props.source && (
            <DropdownMenuItem.LeadingIcon>
              <Icon source={props.source} tint={sourceTint} size={MENU_ITEM_ICON_SIZE} />
            </DropdownMenuItem.LeadingIcon>
          )}
          <DropdownMenuItem.Text>
            <ComposeText>{props.label}</ComposeText>
          </DropdownMenuItem.Text>
          <DropdownMenuItem.TrailingIcon>
            <Icon source={arrowRightIcon} tint={tintColor} size={MENU_ITEM_ICON_SIZE} />
          </DropdownMenuItem.TrailingIcon>
        </DropdownMenuItem>
        <DropdownMenuPopup
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
          anchorPosition="end"
          modifiers={[verticalScroll()]}>
          {menuContent}
        </DropdownMenuPopup>
      </Box>
    );
  }

  // Root: AnimatedItemContainer + IconButton trigger + DropdownMenuPopup
  if (!props.source) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.Menu on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.'
      );
    }
    return null;
  }

  const backgroundColor = (toolbarColors.backgroundColor ??
    DEFAULT_TOOLBAR_BACKGROUND_COLOR()) as string;

  const iconButton = (
    <IconButton
      onClick={() => setExpanded(true)}
      enabled={!props.disabled}
      colors={getIconButtonContainerColors(toolbarColors.buttonContainerColor)}
      // The background modifier would paint a square behind the round container
      modifiers={toolbarColors.buttonContainerColor ? [] : [background(backgroundColor)]}>
      <Icon
        source={props.source}
        tint={sourceTint}
        size={24}
        contentDescription={getBadgeContentDescription(props.accessibilityLabel, props.badge)}
      />
    </IconButton>
  );

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <Box>
        <ToolbarItemBadge badge={props.badge} disabled={props.disabled}>
          {iconButton}
        </ToolbarItemBadge>
        <DropdownMenuPopup
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
          // Unlike `DropdownMenu`, `DropdownMenuPopup` does not scroll a menu taller than the window.
          modifiers={[verticalScroll()]}>
          {menuContent}
        </DropdownMenuPopup>
      </Box>
    </AnimatedItemContainer>
  );
};

/**
 * Native toolbar menu action component for Android.
 * Renders a `SelectableDropdownMenuItem` when `isOn` is set, and a `DropdownMenuItem` otherwise.
 */
export const NativeToolbarMenuAction: React.FC<NativeToolbarMenuActionProps> = (props) => {
  const {
    expoUI: { DropdownMenuItem, Icon, SelectableDropdownMenuItem, Text: ComposeText },
  } = requireExpoUI(EXPO_UI_REQUIRED_MESSAGE);
  const closeMenu = use(ToolbarMenuCloseContext);
  const shape = use(MenuItemShapeContext) ?? { index: 0, count: 1 };
  const toolbarColors = useToolbarColors();
  const tintColor = props.destructive
    ? DEFAULT_DESTRUCTIVE_COLOR()
    : (toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR());

  const handleClick = useCallback(() => {
    props.onPress?.();
    if (!props.unstable_keepPresented) {
      closeMenu?.();
    }
  }, [props.onPress, props.unstable_keepPresented, closeMenu]);

  const areChildrenString = typeof props.children === 'string';
  const label = areChildrenString
    ? props.children
    : (getFirstChildOfType(props.children, Label)?.props.children ?? '');

  if (props.hidden) return null;

  // Without a `tint`, the icon takes the item's icon color, which the item sets for each state.
  const leadingIcon = props.source && <Icon source={props.source} size={MENU_ITEM_ICON_SIZE} />;
  const text = <ComposeText>{label}</ComposeText>;

  if (props.isOn !== undefined) {
    return (
      <SelectableDropdownMenuItem
        selected={props.isOn}
        onClick={handleClick}
        enabled={!props.disabled}
        shapes={shape}
        colors={{
          textColor: tintColor,
          leadingIconColor: tintColor,
          // Compose gives an unselected item the default group color. Match the group color instead.
          ...(toolbarColors.backgroundColor
            ? { containerColor: toolbarColors.backgroundColor }
            : {}),
        }}>
        <SelectableDropdownMenuItem.Text>{text}</SelectableDropdownMenuItem.Text>
        {leadingIcon && (
          <SelectableDropdownMenuItem.LeadingIcon>
            {leadingIcon}
          </SelectableDropdownMenuItem.LeadingIcon>
        )}
        <SelectableDropdownMenuItem.SelectedLeadingIcon>
          <Icon source={checkmarkIcon} size={MENU_ITEM_ICON_SIZE} />
        </SelectableDropdownMenuItem.SelectedLeadingIcon>
      </SelectableDropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      onClick={handleClick}
      enabled={!props.disabled}
      shape={shape}
      elementColors={{ textColor: tintColor, leadingIconColor: tintColor }}>
      <DropdownMenuItem.Text>{text}</DropdownMenuItem.Text>
      {leadingIcon && <DropdownMenuItem.LeadingIcon>{leadingIcon}</DropdownMenuItem.LeadingIcon>}
    </DropdownMenuItem>
  );
};
