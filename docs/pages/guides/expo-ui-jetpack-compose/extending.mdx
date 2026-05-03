---
title: Extending with Jetpack Compose
sidebar_title: Extending with Jetpack Compose
description: Learn how to create custom Jetpack Compose components and modifiers that integrate with Expo UI.
platforms: ['android']
---

import { Prerequisites, Requirement } from '~/ui/components/Prerequisites';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { CODE } from '~/ui/components/Text';

This guide explains how to create custom Jetpack Compose components and modifiers that integrate seamlessly with Expo UI.

<Prerequisites>
  <Requirement title={<><CODE>@expo/ui</CODE> installed</>}>
    See [Building Jetpack Compose apps with Expo UI](/versions/latest/sdk/ui/jetpack-compose/) for more information.

    <Terminal cmd={['$ npx expo install @expo/ui']} />

  </Requirement>
  <Requirement title="A development build of your app">
    Expo UI is not available in Expo Go. Create a [development build](/develop/development-builds/introduction/) of your app.
  </Requirement>
  <Requirement title="Basic familiarity with Expo Modules API and Jetpack Compose">
    Familiarity with [Expo Modules API](/modules/overview/) and [Jetpack Compose](https://developer.android.com/jetpack/compose).
  </Requirement>
</Prerequisites>

## Creating a custom component

### Project setup

<Step label="1">

Create a local Expo module in your project:

<Terminal cmd={['$ npx create-expo-module@latest --local my-ui']} />

</Step>

<Step label="2">

Update your module's **android/build.gradle** to enable Jetpack Compose and depend on `expo-ui`. The lines marked below are added on top of the default scaffold:

```groovy my-ui/android/build.gradle
// Pull in the Kotlin Compose compiler plugin classpath.
buildscript {
  repositories {
    mavenCentral()
  }
  dependencies {
    classpath("org.jetbrains.kotlin.plugin.compose:org.jetbrains.kotlin.plugin.compose.gradle.plugin:${kotlinVersion}")
  }
}

apply plugin: 'com.android.library'
apply plugin: 'expo-module-gradle-plugin'
apply plugin: 'org.jetbrains.kotlin.plugin.compose' // Apply the Compose compiler plugin.

// ... group / version

android {
  // ... namespace, defaultConfig

  // Turn on Jetpack Compose for this module.
  buildFeatures {
    compose true
  }
}

// Depend on `expo-ui` plus the Compose libraries you use.
dependencies {
  if (findProject(':expo-ui') != null) {
    implementation project(':expo-ui')
  } else {
    implementation 'expo.modules.ui:expo.modules.ui:+'
  }
  implementation 'androidx.compose.foundation:foundation-android:1.10.6'
  implementation 'androidx.compose.ui:ui-android:1.10.6'
  implementation 'androidx.compose.material3:material3:1.5.0-alpha17'
}
```

</Step>

### Creating a Compose view

<Step label="3">

Create your Compose view. It has two parts:

1. **Props data class**: annotated with `@OptimizedComposeProps`, implements `ComposeProps`, and includes a `modifiers: ModifierList` field for the [`modifiers`](/versions/latest/sdk/ui/jetpack-compose/modifiers/) prop.
2. **`@Composable` content function**: an extension on `FunctionalComposableScope` so it can call `ModifierRegistry.applyModifiers(...)` and render `Children(...)`.

```kotlin my-ui/android/src/main/java/expo/modules/myui/MyCustomView.kt
package expo.modules.myui

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.UIComposableScope

@OptimizedComposeProps
data class MyCustomViewProps(
  val title: String = "",
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.MyCustomViewContent(props: MyCustomViewProps) {
  Column(
    modifier = ModifierRegistry.applyModifiers(
      props.modifiers,
      appContext,
      composableScope,
      globalEventDispatcher
    )
  ) {
    Text(text = props.title, style = MaterialTheme.typography.titleMedium)
    Children(UIComposableScope()) // Renders React children
  }
}
```

</Step>

<Step label="4">

Register the view in your module using `ExpoUIView`. This wires your `@Composable` content into the Expo modules view system and makes it available to JavaScript:

```kotlin my-ui/android/src/main/java/expo/modules/myui/MyUiModule.kt
package expo.modules.myui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ExpoUIView

class MyUiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyUi")

    ExpoUIView<MyCustomViewProps>("MyCustomView") {
      Content { props ->
        MyCustomViewContent(props)
      }
    }
  }
}
```

</Step>

<Step label="5">

Create a wrapper component that connects modifiers with event handling. The `createViewModifierEventListener` utility enables event-based modifiers like `clickable` and `onVisibilityChanged` to work with your custom view:

```tsx my-ui/src/MyCustomView.tsx
import { type PrimitiveBaseProps } from '@expo/ui/jetpack-compose';
import { createViewModifierEventListener } from '@expo/ui/jetpack-compose/modifiers';
import { requireNativeView } from 'expo';

export interface MyCustomViewProps extends PrimitiveBaseProps {
  title: string;
  children?: React.ReactNode;
}

const NativeMyCustomView = requireNativeView<MyCustomViewProps>('MyUi', 'MyCustomView');

export function MyCustomView({ modifiers, ...restProps }: MyCustomViewProps) {
  return (
    <NativeMyCustomView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
    />
  );
}
```

</Step>

### Using your custom component

Your custom component now works with all `@expo/ui` built-in modifiers:

```tsx app/index.tsx
import { Host, Text } from '@expo/ui/jetpack-compose';
import { background, clip, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { MyCustomView } from './modules/my-ui';

export default function App() {
  return (
    <Host style={{ flex: 1 }}>
      <MyCustomView
        title="Hello World"
        modifiers={[
          paddingAll(16),
          background('#f0f0f0'),
          clip({ type: 'roundedCorner', radius: 12 }),
        ]}>
        <Text>Child content</Text>
      </MyCustomView>
    </Host>
  );
}
```

## Creating custom modifiers

You can also create custom modifiers that work with any Expo UI component.

> **info** Modifiers are Compose's way to configure layouts for styling, sizing, behavior, and more. Learn more in Android's [Compose modifiers documentation](https://developer.android.com/jetpack/compose/modifiers).

### Native modifier implementation

<Step label="1">

Define your modifier's parameters as an `@OptimizedRecord` data class, and a function that returns a `Modifier` from those params:

```kotlin my-ui/android/src/main/java/expo/modules/myui/CustomBorderModifier.kt
package expo.modules.myui

import android.graphics.Color
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.ui.compose

@OptimizedRecord
data class CustomBorderParams(
  @Field val color: Color? = null,
  @Field val width: Int = 2,
  @Field val cornerRadius: Int = 0
) : Record

fun customBorderModifier(params: CustomBorderParams): Modifier {
  return Modifier.border(
    border = BorderStroke(params.width.dp, params.color.compose),
    shape = RoundedCornerShape(params.cornerRadius.dp)
  )
}
```

`compose` is a Kotlin extension property on `android.graphics.Color?` defined in the `expo.modules.ui` package. Importing it with `import expo.modules.ui.compose` lets you call `params.color.compose` to convert the Android `Color` parsed from JS into the `androidx.compose.ui.graphics.Color` that Compose APIs (like `BorderStroke`) expect. It's the same helper Expo UI's built-in modifiers use.

</Step>

<Step label="2">

Register your modifier with `ModifierRegistry` in your module definition. Use `OnCreate` to register and `OnDestroy` to unregister so the factory does not leak across module reloads:

```kotlin my-ui/android/src/main/java/expo/modules/myui/MyUiModule.kt
package expo.modules.myui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.recordFromMap
import expo.modules.ui.ExpoUIView
import expo.modules.ui.ModifierRegistry

class MyUiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyUi")

    OnCreate {
      ModifierRegistry.register("customBorder") { map, _, _, _ ->
        customBorderModifier(recordFromMap<CustomBorderParams>(map))
      }
    }

    OnDestroy {
      ModifierRegistry.unregister("customBorder")
    }

    ExpoUIView<MyCustomViewProps>("MyCustomView") {
      Content { props ->
        MyCustomViewContent(props)
      }
    }
  }
}
```

The `register` lambda receives the raw map sent from JavaScript, the current `ComposableScope` (use it for scope-dependent modifiers like `weight` or `align`), the `AppContext`, and an event dispatcher. Most modifiers only need `map` and convert it via `recordFromMap<T>(map)`.

</Step>

### JavaScript modifier function

<Step label="3">

Create a TypeScript function that builds the modifier config:

```ts my-ui/src/modifiers.ts
import { createModifier } from '@expo/ui/jetpack-compose/modifiers';
import { type ColorValue } from 'react-native';

export const customBorder = (params: {
  color?: ColorValue;
  width?: number;
  cornerRadius?: number;
}) => createModifier('customBorder', params);
```

</Step>

<Step label="4">

Export the modifier from your module:

```ts my-ui/index.ts
export { MyCustomView, type MyCustomViewProps } from './src/MyCustomView';
export { customBorder } from './src/modifiers';
```

</Step>

### Using custom modifiers

Your custom modifier works with any `@expo/ui` component:

```tsx app/index.tsx
import { Column, Host, Text } from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { customBorder } from './modules/my-ui';

export default function App() {
  return (
    <Host style={{ flex: 1 }}>
      <Column
        modifiers={[paddingAll(20), customBorder({ color: '#FF6B35', width: 3, cornerRadius: 8 })]}>
        <Text>This has a custom border!</Text>
      </Column>
    </Host>
  );
}
```

## Next steps

Congratulations! You've learned how to extend Expo UI with custom Jetpack Compose components and modifiers. Your custom components now integrate seamlessly with the built-in modifier system.

Here are some ideas for what to build next:

- Use the [built-in Jetpack Compose components](/versions/latest/sdk/ui/jetpack-compose/) that come with Expo UI.
- Build custom modifiers for app-specific styling patterns.
- Wrap third-party Compose libraries for use in React Native.
- Share your components as an npm package for others to use.
