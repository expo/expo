---
title: Picker
description: A picker compatible with @react-native-picker/picker.
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-ui'
packageName: '@expo/ui'
platforms: ['android', 'ios', 'web', 'expo-go']
---

import APISection from '~/components/plugins/APISection';
import { APIInstallSection } from '~/components/plugins/InstallSection';

A `Picker` component with an API compatible with `@react-native-picker/picker`. It uses a SwiftUI wheel `Picker` on iOS, a Material 3 `ExposedDropdownMenuBox` on Android, and a native `<select>` element on web.

Under the hood this component wraps the platform-specific `@expo/ui` primitives:

- **Android**: [Jetpack Compose ExposedDropdownMenuBox](../jetpack-compose/exposeddropdownmenubox)
- **iOS**: [SwiftUI Picker](../swift-ui/picker) with `pickerStyle('wheel')`

If you need lower-level control, use those primitives directly.

## Installation

<APIInstallSection />

## Migrating from `@react-native-picker/picker`

- Update the import from `import { Picker } from '@react-native-picker/picker'` to `import { Picker } from '@expo/ui/community/picker'`.
- `mode`, `prompt`, `dropdownIconColor`, `dropdownIconRippleColor`, `numberOfLines`, `selectionColor`, `itemStyle`, and `accessibilityLabel` props are not supported.
- On `Picker.Item`, the `style` prop only applies `color`, `backgroundColor`, `fontFamily`, and `fontSize`. The top-level `color` and `fontFamily` props are still supported as aliases for the corresponding `style` values.
- `enabled` on `Picker.Item` only applies on Android.
- The `ref` `focus()` and `blur()` methods only have an effect on Android (open/close the dropdown). On iOS, the wheel picker is always visible.

## Basic usage

```tsx PickerExample.tsx
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Picker } from '@expo/ui/community/picker';

export default function PickerExample() {
  const [language, setLanguage] = useState('java');

  return (
    <View>
      <Picker selectedValue={language} onValueChange={value => setLanguage(value)}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" />
      </Picker>
      <Text>Selected: {language}</Text>
    </View>
  );
}
```

## Per-item styling and state

Pass a `style` to `Picker.Item` to control `color`, `backgroundColor`, `fontFamily`, and `fontSize` per item, and `enabled={false}` to disable specific items on Android.

`fontFamily` accepts iOS font names (for example, `'Menlo'`) on iOS, and Compose generic families (`'monospace'`, `'serif'`, `'sansSerif'`, `'cursive'`) or fonts loaded with [`expo-font`](../../font) on Android.

```tsx StyledPickerExample.tsx
import { useState } from 'react';
import { Platform } from 'react-native';
import { Picker } from '@expo/ui/community/picker';

const monospace = Platform.select({ ios: 'Menlo', android: 'monospace' });
const serif = Platform.select({ ios: 'Georgia', android: 'serif' });

export default function StyledPickerExample() {
  const [language, setLanguage] = useState('java');

  return (
    <Picker selectedValue={language} onValueChange={value => setLanguage(value)}>
      <Picker.Item
        label="Java"
        value="java"
        style={{ color: '#e11d48', fontFamily: monospace, fontSize: 14 }}
      />
      <Picker.Item
        label="JavaScript"
        value="js"
        style={{ color: '#2563eb', fontFamily: serif, fontSize: 18 }}
        enabled={false}
      />
      <Picker.Item
        label="Objective C"
        value="objc"
        style={{ color: '#059669', fontFamily: monospace, fontSize: 16 }}
      />
      <Picker.Item
        label="Swift"
        value="swift"
        style={{ color: '#d97706', fontFamily: serif, fontSize: 30 }}
        enabled={false}
      />
    </Picker>
  );
}
```

## Imperative focus and blur (Android)

Use a ref to programmatically open and close the dropdown on Android. On iOS, these methods are no-ops because the wheel picker is always visible.

```tsx RefPickerExample.tsx
import { useRef, useState } from 'react';
import { Button } from 'react-native';
import { Picker, type PickerRef } from '@expo/ui/community/picker';

export default function RefPickerExample() {
  const [language, setLanguage] = useState('java');
  const pickerRef = useRef<PickerRef>(null);

  return (
    <>
      <Button
        title="Open and close after 2s"
        onPress={() => {
          pickerRef.current?.focus();
          setTimeout(() => pickerRef.current?.blur(), 2000);
        }}
      />
      <Picker ref={pickerRef} selectedValue={language} onValueChange={setLanguage}>
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="js" />
        <Picker.Item label="Objective C" value="objc" />
        <Picker.Item label="Swift" value="swift" />
      </Picker>
    </>
  );
}
```

## API

```tsx
import { Picker } from '@expo/ui/community/picker';
```

<APISection packageName="expo-ui/community/picker" apiName="Picker" />
