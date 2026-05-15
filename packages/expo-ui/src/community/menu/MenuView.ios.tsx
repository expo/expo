import * as React from 'react';

import type { MenuAction, MenuComponentProps, MenuComponentRef, NativeActionEvent } from './types';
import { Button } from '../../swift-ui/Button';
import { ContextMenu } from '../../swift-ui/ContextMenu';
import { Host } from '../../swift-ui/Host';
import { Menu } from '../../swift-ui/Menu';
import { RNHostView } from '../../swift-ui/RNHostView';
import { Section } from '../../swift-ui/Section';
import { Toggle } from '../../swift-ui/Toggle';
import {
  disabled as disabledModifier,
  foregroundColor as foregroundColorModifier,
  tint as tintModifier,
} from '../../swift-ui/modifiers';
import type { ModifierConfig } from '../../types';

function actionId(action: MenuAction): string {
  return action.id ?? action.title;
}

function makeEvent(action: MenuAction): NativeActionEvent {
  return { nativeEvent: { event: actionId(action) } };
}

function renderAction(
  action: MenuAction,
  onPressAction: MenuComponentProps['onPressAction']
): React.ReactNode {
  if (action.attributes?.hidden) {
    return null;
  }

  const { subactions, displayInline, state, attributes, image, imageColor, title } = action;
  const key = actionId(action);
  const systemImage = typeof image === 'string' ? image : undefined;
  // `tint` is what SwiftUI's `Menu`/`Button` honor for the leading SF Symbol —
  // `foregroundColor` would also affect the label text.
  const tintMod = imageColor ? tintModifier(imageColor) : null;

  if (subactions && subactions.length > 0) {
    const children = subactions.map((sub) => renderAction(sub, onPressAction));
    if (displayInline) {
      return (
        <Section key={key} title={title}>
          {children}
        </Section>
      );
    }
    // SwiftUI's system menu UI ignores per-item color modifiers on submenu
    // headers, so we don't forward `imageColor` here. Leaf `Button`s below
    // tint via `foregroundColor`, which does take effect.
    return (
      <Menu key={key} label={title} systemImage={systemImage}>
        {children}
      </Menu>
    );
  }

  const fire = () => onPressAction?.(makeEvent(action));

  const modifiers: ModifierConfig[] = [];
  if (attributes?.disabled) modifiers.push(disabledModifier(true));

  if (state === 'on' || state === 'off') {
    if (tintMod) modifiers.push(tintMod);
    return (
      <Toggle
        key={key}
        label={title}
        systemImage={systemImage}
        isOn={state === 'on'}
        onIsOnChange={fire}
        modifiers={modifiers.length > 0 ? modifiers : undefined}
      />
    );
  }

  // For a leaf `Button`, `foregroundColor` also tints the system image —
  // upstream uses this to color both the label and the icon. Skip when the
  // role is destructive so SwiftUI's red tint remains in effect.
  if (imageColor && !attributes?.destructive) {
    modifiers.push(foregroundColorModifier(imageColor));
  }

  return (
    <Button
      key={key}
      label={title}
      systemImage={systemImage}
      role={attributes?.destructive ? 'destructive' : undefined}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
      onPress={fire}
    />
  );
}

let warnedShowNoop = false;

/**
 * A drop-in replacement for `@react-native-menu/menu` on iOS.
 * Uses SwiftUI `Menu` for tap triggers and `ContextMenu` for long-press triggers.
 */
export function MenuView(props: MenuComponentProps & { ref?: React.Ref<MenuComponentRef> }) {
  const { ref, actions, onPressAction, shouldOpenOnLongPress, title, style, children, testID } =
    props;

  // SwiftUI `Menu`/`ContextMenu` expose no programmatic open API, so `show()`
  // can't do anything on iOS. Surface that as a one-time dev warning instead of
  // silently no-opping.
  React.useImperativeHandle(
    ref,
    () => ({
      show: () => {
        if (__DEV__ && !warnedShowNoop) {
          warnedShowNoop = true;
          console.warn(
            '[@expo/ui] MenuView.show() is a no-op on iOS. SwiftUI Menu/ContextMenu have no programmatic open API.'
          );
        }
      },
    }),
    []
  );

  const items = actions.map((action) => renderAction(action, onPressAction));
  const body = title ? <Section title={title}>{items}</Section> : items;

  // RNHostView requires a single ReactElement; wrap in a fragment so callers
  // can pass any `ReactNode` (string, array, etc.).
  const trigger = (
    <RNHostView matchContents>
      <>{children}</>
    </RNHostView>
  );

  return (
    <Host matchContents style={style} testID={testID}>
      {shouldOpenOnLongPress ? (
        <ContextMenu>
          <ContextMenu.Trigger>{trigger}</ContextMenu.Trigger>
          <ContextMenu.Items>{body}</ContextMenu.Items>
        </ContextMenu>
      ) : (
        <Menu label={trigger}>{body}</Menu>
      )}
    </Host>
  );
}
