'use client';

import React, { Children, isValidElement, useMemo, useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import {
  LinkMenu,
  LinkMenuAction,
  LinkTrigger,
  type LinkMenuActionProps,
  type LinkMenuProps,
} from './elements';
import type { LinkProps } from './useLinkHooks';
import { getAllChildrenNotOfType, getFirstChildOfType } from '../utils/children';

function extractActions(menuElement: ReactElement<LinkMenuProps>): LinkMenuActionProps[] {
  const actions: LinkMenuActionProps[] = [];
  Children.toArray(menuElement.props.children).forEach((child) => {
    if (isValidElement(child) && child.type === LinkMenuAction) {
      const props = child.props as LinkMenuActionProps;
      if (!props.hidden) {
        actions.push(props);
      }
    }
    // Skip LinkMenu children (nested submenus) — only collect flat actions
  });
  return actions;
}

function getActionLabel(action: LinkMenuActionProps): string | undefined {
  if (typeof action.children === 'string') {
    return action.children;
  }
  return action.title;
}

export function LinkWithMenuDialog({ children, onLongPress, ...rest }: LinkProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const triggerElement = useMemo(() => getFirstChildOfType(children, LinkTrigger), [children]);
  const menuElement = useMemo(
    () => getFirstChildOfType(children, LinkMenu) as ReactElement<LinkMenuProps> | undefined,
    [children]
  );

  const trigger = useMemo(
    () => triggerElement ?? getAllChildrenNotOfType(children, LinkMenu),
    [triggerElement, children]
  );
  const actions = useMemo(() => (menuElement ? extractActions(menuElement) : []), [menuElement]);
  const menuTitle = menuElement?.props.title;

  const handleLongPress = (e: GestureResponderEvent) => {
    if (actions.length > 0) {
      setIsModalVisible(true);
    }
    onLongPress?.(e);
  };

  return (
    <>
      <BaseExpoRouterLink {...rest} onLongPress={handleLongPress} children={trigger} />
      <Modal
        visible={isModalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <Pressable
          testID="menu-dialog-backdrop"
          style={styles.backdrop}
          accessibilityRole="none"
          onPress={() => setIsModalVisible(false)}>
          {/* onStartShouldSetResponder prevents backdrop onPress when tapping inside the dialog */}
          <View
            style={styles.dialog}
            accessibilityRole="menu"
            onStartShouldSetResponder={() => true}>
            {menuTitle ? <Text style={styles.title}>{menuTitle}</Text> : null}
            {actions.map((action, index) => {
              const label = getActionLabel(action);
              return (
                <Pressable
                  key={index}
                  disabled={action.disabled}
                  accessibilityRole="menuitem"
                  accessibilityLabel={label}
                  accessibilityState={{ disabled: action.disabled }}
                  onPress={() => {
                    setIsModalVisible(false);
                    action.onPress?.();
                  }}
                  style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}>
                  <Text
                    style={[
                      styles.actionText,
                      action.destructive && styles.destructiveText,
                      action.disabled && styles.disabledText,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 240,
    maxWidth: '80%',
    elevation: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionItemPressed: {
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 16,
    color: '#212121',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  disabledText: {
    opacity: 0.38,
  },
});
