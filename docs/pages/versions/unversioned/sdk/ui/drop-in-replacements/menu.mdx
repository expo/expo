---
title: Menu
description: A menu compatible with @react-native-menu/menu.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-ui'
packageName: '@expo/ui'
platforms: ['android', 'ios', 'expo-go']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';

A `MenuView` component with an API compatible with [`@react-native-menu/menu`](https://www.npmjs.com/package/@react-native-menu/menu). Supports both single-tap (default) and long-press (`shouldOpenOnLongPress`) triggers.

Under the hood this component wraps the platform-specific `@expo/ui` primitives:

- **Android**: [Jetpack Compose DropdownMenu](../jetpack-compose/dropdownmenu) anchored to a `Pressable` trigger.
- **iOS**: [SwiftUI Menu](../swift-ui/menu) for tap triggers and [SwiftUI ContextMenu](../swift-ui/contextmenu) for long-press triggers.

If you need lower-level control, use those primitives directly.

## Installation

<APIInstallSection />

## Migrating from `@react-native-menu/menu`

- Update the import from `import { MenuView } from '@react-native-menu/menu'` to `import { MenuView } from '@expo/ui/community/menu'`.
- `action.image` on Android differs from upstream. `@react-native-menu/menu` expects a **drawable resource name** string (for example, `'ic_menu_add'`) that it resolves against `android/app/src/main/res/drawable/`. This drop-in does **not** resolve drawable resource names — pass an `ImageSourcePropType` instead (for example, `require('@expo/material-symbols/edit.xml')`). String values are accepted on iOS as SF Symbol names. Use [`Icon.select`](../universal/icon) to define both per call site so the unused side tree-shakes out per platform.
- `title` is rendered as a section header on iOS only; Android's Material `DropdownMenu` has no title slot.
- On Android, `MenuView` wraps the trigger in its own `Pressable` to open the menu, so an `onPress`/`onLongPress` handler attached to a `Pressable` you pass as `children` won't fire — the outer wrapper claims the gesture. Move that handler into your `onPressAction` switch instead, or use the lower-level [`DropdownMenu`](../jetpack-compose/dropdownmenu) primitive if you need to keep separate tap and long-press actions on the trigger.
- The imperative `ref.show()` API is **Android-only**. SwiftUI `Menu`/`ContextMenu` have no programmatic open API, so on iOS the call is a no-op (with a one-time dev warning).
- The following props from `@react-native-menu/menu` are not supported: `themeVariant`, `hitSlop`, `isAnchoredToRight`, `subtitle`, `keepsMenuPresented`, `preferredElementSize`, and `state: 'mixed'`.

## Basic usage

```tsx MenuExample.tsx
import { Icon } from '@expo/ui';
import { MenuView } from '@expo/ui/community/menu';
import { Pressable, Text } from 'react-native';

const editIcon = Icon.select({
  ios: 'pencil',
  android: import('@expo/material-symbols/edit.xml'),
});

const deleteIcon = Icon.select({
  ios: 'trash',
  android: import('@expo/material-symbols/delete.xml'),
});

export default function MenuExample() {
  return (
    <MenuView
      actions={[
        { id: 'edit', title: 'Edit', image: editIcon },
        { id: 'delete', title: 'Delete', image: deleteIcon, attributes: { destructive: true } },
      ]}
      onPressAction={e => console.log(e.nativeEvent.event)}>
      <Pressable>
        <Text>Open menu</Text>
      </Pressable>
    </MenuView>
  );
}
```

## Long-press (context menu)

Set `shouldOpenOnLongPress` to render as a context menu. On Android, the same controlled `DropdownMenu` opens from the `Pressable`'s `onLongPress` instead of `onPress`. On iOS, this uses SwiftUI's `ContextMenu` and shows the trigger as a blurred preview.

```tsx LongPressMenuExample.tsx
import { Icon } from '@expo/ui';
import { MenuView } from '@expo/ui/community/menu';
import { Pressable, Text } from 'react-native';

const copyIcon = Icon.select({
  ios: 'doc.on.doc',
  android: import('@expo/material-symbols/content_copy.xml'),
});

const shareIcon = Icon.select({
  ios: 'square.and.arrow.up',
  android: import('@expo/material-symbols/share.xml'),
});

export default function LongPressMenuExample() {
  return (
    <MenuView
      shouldOpenOnLongPress
      actions={[
        { id: 'copy', title: 'Copy', image: copyIcon },
        { id: 'share', title: 'Share', image: shareIcon },
      ]}
      onPressAction={e => console.log(e.nativeEvent.event)}>
      <Pressable>
        <Text>Long-press me</Text>
      </Pressable>
    </MenuView>
  );
}
```

## Submenus and inline sections

`subactions` renders nested actions as a submenu by default. Set `displayInline: true` on the parent to render the children as an inline section instead, which is useful for grouping. On Android, only the divider appears (Material's `DropdownMenu` has no section primitive). On iOS, the parent's `title` becomes the section header.

```tsx SubmenuExample.tsx
import { MenuView } from '@expo/ui/community/menu';
import { Pressable, Text } from 'react-native';

export default function SubmenuExample() {
  return (
    <MenuView
      actions={[
        { id: 'rename', title: 'Rename' },
        {
          id: 'sort',
          title: 'Sort by',
          subactions: [
            { id: 'sort-name', title: 'Name' },
            { id: 'sort-date', title: 'Date' },
            { id: 'sort-size', title: 'Size' },
          ],
        },
        {
          id: 'share-section',
          title: 'Share',
          displayInline: true,
          subactions: [
            { id: 'share-airdrop', title: 'AirDrop' },
            { id: 'share-message', title: 'Message' },
          ],
        },
      ]}
      onPressAction={e => console.log(e.nativeEvent.event)}>
      <Pressable>
        <Text>Open menu</Text>
      </Pressable>
    </MenuView>
  );
}
```

## Toggle items with checkmarks

Set `state` to `'on'` or `'off'` to render an action as a togglable item with a leading checkmark when on. Selecting the action fires `onPressAction` and the caller is responsible for updating the state.

```tsx ToggleMenuExample.tsx
import { MenuView } from '@expo/ui/community/menu';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

export default function ToggleMenuExample() {
  const [pinned, setPinned] = useState(false);
  return (
    <MenuView
      actions={[{ id: 'pin', title: 'Pin to top', state: pinned ? 'on' : 'off' }]}
      onPressAction={e => {
        if (e.nativeEvent.event === 'pin') setPinned(p => !p);
      }}>
      <Pressable>
        <Text>{pinned ? 'Pinned' : 'Not pinned'}</Text>
      </Pressable>
    </MenuView>
  );
}
```

## API

```tsx
import { MenuView } from '@expo/ui/community/menu';
```

<APISection packageName="expo-ui/community/menu" apiName="MenuView" />
