'use client';
import {
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Icon,
  IconButton,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { background } from '@expo/ui/jetpack-compose/modifiers';
import { createContext, use, useCallback, useState } from 'react';

import type { NativeToolbarMenuActionProps, NativeToolbarMenuProps } from './types';
import { Label } from '../../../../primitives';
import { AnimatedItemContainer } from '../../../../toolbar/AnimatedItemContainer';
import { getFirstChildOfType } from '../../../../utils/children';
import { useToolbarColors } from '../context';
import {
  DEFAULT_DESTRUCTIVE_COLOR,
  DEFAULT_TOOLBAR_BACKGROUND_COLOR,
  DEFAULT_TOOLBAR_TINT_COLOR,
} from '../defaults';

const arrowRightIcon = require('../../../../../assets/arrow_right.xml');
const checkmarkIcon = require('../../../../../assets/checkmark.xml');

/**
 * Context for propagating menu close callbacks from root to nested menus.
 * - `null` means root level (no parent menu)
 * - A function means nested level (call to close entire menu chain)
 */
const ToolbarMenuCloseContext = createContext<(() => void) | null>(null);

/**
 * Native toolbar menu component for Android bottom toolbar.
 * Renders as a DropdownMenu with IconButton trigger (root) or DropdownMenuItem trigger (nested).
 */
export const NativeToolbarMenu: React.FC<NativeToolbarMenuProps> = (props) => {
  const [expanded, setExpanded] = useState(false);
  const parentClose = use(ToolbarMenuCloseContext);
  const isNested = parentClose !== null;
  const toolbarColors = useToolbarColors();

  const tintColor =
    props.imageRenderingMode === 'original'
      ? undefined
      : (props.tintColor ?? toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR());

  const backgroundColor = (toolbarColors.backgroundColor ??
    DEFAULT_TOOLBAR_BACKGROUND_COLOR()) as string;

  const closeMenu = useCallback(() => {
    setExpanded(false);
    parentClose?.();
  }, [parentClose]);

  // Inline nested: render children directly with a divider separator
  if (isNested && props.inline) {
    return (
      <>
        <HorizontalDivider />
        {props.children}
      </>
    );
  }

  // Non-inline nested: DropdownMenu with DropdownMenuItem trigger
  if (isNested) {
    const trailingIcon = (
      <DropdownMenuItem.TrailingIcon>
        <Icon source={arrowRightIcon} tintColor={tintColor} size={24} />
      </DropdownMenuItem.TrailingIcon>
    );
    const leadingIcon = props.source ? (
      <DropdownMenuItem.LeadingIcon>
        <Icon source={props.source} tintColor={tintColor} size={24} />
      </DropdownMenuItem.LeadingIcon>
    ) : null;
    return (
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        color={backgroundColor}>
        <DropdownMenu.Trigger>
          <DropdownMenuItem
            onClick={() => {
              if (!props.disabled) setExpanded(true);
            }}
            modifiers={[background(backgroundColor)]}
            enabled={!props.disabled}>
            {leadingIcon}
            <DropdownMenuItem.Text>
              <ComposeText
                color={
                  typeof props.tintColor === 'string'
                    ? props.tintColor
                    : ((toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR()) as string)
                }>
                {props.label}
              </ComposeText>
            </DropdownMenuItem.Text>
            {trailingIcon}
          </DropdownMenuItem>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <ToolbarMenuCloseContext value={closeMenu}>{props.children}</ToolbarMenuCloseContext>
        </DropdownMenu.Items>
      </DropdownMenu>
    );
  }

  // Root: AnimatedItemContainer + IconButton trigger + DropdownMenu
  if (!props.source) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.Menu on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.'
      );
    }
    return null;
  }

  return (
    <AnimatedItemContainer visible={!props.hidden}>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={() => setExpanded(false)}
        color={backgroundColor}>
        <DropdownMenu.Trigger>
          <IconButton onClick={() => setExpanded(true)} enabled={!props.disabled}>
            <Icon source={props.source} tintColor={tintColor} size={24} />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <ToolbarMenuCloseContext value={closeMenu}>{props.children}</ToolbarMenuCloseContext>
        </DropdownMenu.Items>
      </DropdownMenu>
    </AnimatedItemContainer>
  );
};

/**
 * Native toolbar menu action component for Android.
 * Renders as a DropdownMenuItem.
 */
export const NativeToolbarMenuAction: React.FC<NativeToolbarMenuActionProps> = (props) => {
  const closeMenu = use(ToolbarMenuCloseContext);
  const toolbarColors = useToolbarColors();
  const tintColor = props.destructive
    ? (DEFAULT_DESTRUCTIVE_COLOR() as string)
    : ((toolbarColors.tintColor ?? DEFAULT_TOOLBAR_TINT_COLOR()) as string);

  const backgroundColor = (toolbarColors.backgroundColor ??
    DEFAULT_TOOLBAR_BACKGROUND_COLOR()) as string;

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

  return (
    <DropdownMenuItem
      onClick={handleClick}
      modifiers={[background(backgroundColor)]}
      enabled={!props.disabled}>
      <DropdownMenuItem.Text>
        <ComposeText color={tintColor}>{label}</ComposeText>
      </DropdownMenuItem.Text>
      {props.source && (
        <DropdownMenuItem.LeadingIcon>
          <Icon source={props.source} tintColor={tintColor} size={24} />
        </DropdownMenuItem.LeadingIcon>
      )}
      {props.isOn && (
        <DropdownMenuItem.TrailingIcon>
          <Icon source={checkmarkIcon} tintColor={tintColor} size={24} />
        </DropdownMenuItem.TrailingIcon>
      )}
    </DropdownMenuItem>
  );
};
